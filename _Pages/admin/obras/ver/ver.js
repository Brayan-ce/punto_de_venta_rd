"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerObraPorId } from './servidor'
import { formatearEstadoObra, formatearTipoObra } from '../../core/construction/estados'
import { calcularPorcentajeEjecutado, calcularDiasRestantes } from '../../core/construction/calculos'
import estilos from './ver.module.css'

export default function VerObra({ id }) {
    const router = useRouter()
    const [obra, setObra] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [tema, setTema] = useState('light')
    const [tabActivo, setTabActivo] = useState('resumen') // Para mobile

    useEffect(() => {
        const t = localStorage.getItem('tema') || 'light'
        setTema(t)
        cargarObra()

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
    }, [id])

    async function cargarObra() {
        setCargando(true)
        try {
            const res = await obtenerObraPorId(id)
            if (res.success && res.obra) {
                setObra(res.obra)
            } else {
                alert(res.mensaje || 'Error al cargar la obra')
                router.push('/admin/obras')
            }
        } catch (error) {
            console.error('Error cargando obra:', error)
            alert('Error al cargar la obra')
            router.push('/admin/obras')
        } finally {
            setCargando(false)
        }
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <h3>Cargando obra...</h3>
                    <p>Obteniendo información detallada</p>
                </div>
            </div>
        )
    }

    if (!obra) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.vacio}>
                    <ion-icon name="alert-circle-outline"></ion-icon>
                    <h3>Obra no encontrada</h3>
                    <p>La obra que buscas no existe o no tienes permisos para verla</p>
                    <button className={estilos.btnVolver} onClick={() => router.push('/admin/obras')}>
                        <ion-icon name="arrow-back-outline"></ion-icon>
                        <span>Volver a Obras</span>
                    </button>
                </div>
            </div>
        )
    }

    const estadoFormateado = formatearEstadoObra(obra.estado)
    const porcentajeEjecutado = calcularPorcentajeEjecutado(
        obra.costo_real || obra.costo_ejecutado || 0,
        obra.presupuesto_aprobado || 0
    )
    const diasRestantes = obra.fecha_fin_estimada 
        ? calcularDiasRestantes(obra.fecha_fin_estimada)
        : null
    
    const saldoRestante = (obra.presupuesto_aprobado || 0) - (obra.costo_real || obra.costo_ejecutado || 0)

    const getProgresoColor = () => {
        if (porcentajeEjecutado >= 90) return 'critico'
        if (porcentajeEjecutado >= 70) return 'atencion'
        return 'normal'
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 0
        }).format(monto || 0)
    }

    const formatearFecha = (fecha) => {
        if (!fecha) return 'N/A'
        return new Date(fecha).toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* Header Sticky */}
            <header className={estilos.header}>
                <div className={estilos.headerContent}>
                    <div className={estilos.headerInfo}>
                        <button 
                            className={estilos.btnVolverMobile}
                            onClick={() => router.back()}
                            aria-label="Volver"
                        >
                            <ion-icon name="arrow-back-outline"></ion-icon>
                        </button>
                        <div className={estilos.headerTitulo}>
                            <h1>{obra.nombre}</h1>
                            <div className={estilos.headerMeta}>
                                {(obra.codigo || obra.codigo_obra) && (
                                    <span className={estilos.codigoObra}>
                                        {obra.codigo || obra.codigo_obra}
                                    </span>
                                )}
                                <span className={`${estilos.badgeEstado} ${estilos[estadoFormateado.color]}`}>
                                    <ion-icon name={
                                        obra.estado === 'activa' ? 'checkmark-circle-outline' :
                                        obra.estado === 'suspendida' ? 'time-outline' :
                                        obra.estado === 'finalizada' ? 'checkmark-done-outline' :
                                        'close-circle-outline'
                                    }></ion-icon>
                                    <span>{estadoFormateado.texto}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className={estilos.headerAcciones}>
                        <button 
                            className={estilos.btnEditar}
                            onClick={() => router.push(`/admin/obras/editar/${id}`)}
                        >
                            <ion-icon name="create-outline"></ion-icon>
                            <span>Editar</span>
                        </button>
                        <button 
                            className={estilos.btnVolver}
                            onClick={() => router.back()}
                        >
                            <ion-icon name="arrow-back-outline"></ion-icon>
                            <span>Volver</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* KPIs Ejecutivos */}
            <section className={estilos.kpisSection}>
                <div className={estilos.kpisContainer}>
                    <div className={`${estilos.kpiCard} ${estilos.primary}`}>
                        <div className={estilos.kpiIcono}>
                            <ion-icon name="cash-outline"></ion-icon>
                        </div>
                        <div className={estilos.kpiInfo}>
                            <span className={estilos.kpiLabel}>Presupuesto</span>
                            <span className={estilos.kpiValor}>
                                {formatearMoneda(obra.presupuesto_aprobado || 0)}
                            </span>
                        </div>
                    </div>

                    <div className={`${estilos.kpiCard} ${estilos.warning}`}>
                        <div className={estilos.kpiIcono}>
                            <ion-icon name="trending-up-outline"></ion-icon>
                        </div>
                        <div className={estilos.kpiInfo}>
                            <span className={estilos.kpiLabel}>Ejecutado</span>
                            <span className={estilos.kpiValor}>
                                {formatearMoneda(obra.costo_real || obra.costo_ejecutado || 0)}
                            </span>
                        </div>
                    </div>

                    <div className={`${estilos.kpiCard} ${getProgresoColor() === 'critico' ? estilos.danger : getProgresoColor() === 'atencion' ? estilos.warning : estilos.success}`}>
                        <div className={estilos.kpiIcono}>
                            <ion-icon name="analytics-outline"></ion-icon>
                        </div>
                        <div className={estilos.kpiInfo}>
                            <span className={estilos.kpiLabel}>Avance</span>
                            <span className={estilos.kpiValor}>
                                {porcentajeEjecutado.toFixed(1)}%
                            </span>
                        </div>
                    </div>

                    <div className={`${estilos.kpiCard} ${diasRestantes !== null && diasRestantes < 0 ? estilos.danger : diasRestantes !== null && diasRestantes < 7 ? estilos.warning : estilos.info}`}>
                        <div className={estilos.kpiIcono}>
                            <ion-icon name="time-outline"></ion-icon>
                        </div>
                        <div className={estilos.kpiInfo}>
                            <span className={estilos.kpiLabel}>Tiempo</span>
                            <span className={estilos.kpiValor}>
                                {diasRestantes !== null 
                                    ? (diasRestantes > 0 ? `${diasRestantes} días` : 'Vencido')
                                    : 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Barra de Progreso General */}
            {porcentajeEjecutado > 0 && (
                <section className={estilos.progresoSection}>
                    <div className={estilos.progresoContainer}>
                        <div className={estilos.progresoHeader}>
                            <span className={estilos.progresoLabel}>Avance General</span>
                            <span className={`${estilos.progresoPorcentaje} ${estilos[getProgresoColor()]}`}>
                                {porcentajeEjecutado.toFixed(1)}%
                            </span>
                        </div>
                        <div className={estilos.barraProgreso}>
                            <div 
                                className={`${estilos.progresoFill} ${estilos[getProgresoColor()]}`}
                                style={{ width: `${Math.min(porcentajeEjecutado, 100)}%` }}
                            />
                        </div>
                        {porcentajeEjecutado >= 90 && obra.estado === 'activa' && (
                            <div className={`${estilos.alertaProgreso} ${estilos.critico}`}>
                                <ion-icon name="warning-outline"></ion-icon>
                                <span>Alerta: Esta obra ha superado el 90% del presupuesto</span>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Tabs Mobile */}
            <div className={estilos.tabsMobile}>
                <button 
                    className={`${estilos.tabMobile} ${tabActivo === 'resumen' ? estilos.tabActivo : ''}`}
                    onClick={() => setTabActivo('resumen')}
                >
                    <ion-icon name="document-text-outline"></ion-icon>
                    <span>Resumen</span>
                </button>
                <button 
                    className={`${estilos.tabMobile} ${tabActivo === 'presupuesto' ? estilos.tabActivo : ''}`}
                    onClick={() => setTabActivo('presupuesto')}
                >
                    <ion-icon name="cash-outline"></ion-icon>
                    <span>Costos</span>
                </button>
                <button 
                    className={`${estilos.tabMobile} ${tabActivo === 'fechas' ? estilos.tabActivo : ''}`}
                    onClick={() => setTabActivo('fechas')}
                >
                    <ion-icon name="calendar-outline"></ion-icon>
                    <span>Fechas</span>
                </button>
                <button 
                    className={`${estilos.tabMobile} ${tabActivo === 'responsables' ? estilos.tabActivo : ''}`}
                    onClick={() => setTabActivo('responsables')}
                >
                    <ion-icon name="people-outline"></ion-icon>
                    <span>Responsables</span>
                </button>
            </div>

            {/* Contenido Principal */}
            <section className={estilos.contenidoPrincipal}>
                {/* Desktop: 2 Columnas */}
                <div className={estilos.gridDesktop}>
                    {/* Columna Izquierda - Información General */}
                    <div className={`${estilos.card} ${estilos.cardInfo}`}>
                        <div className={estilos.cardHeader}>
                            <h2>
                                <ion-icon name="information-circle-outline"></ion-icon>
                                Información General
                            </h2>
                        </div>
                        <div className={estilos.cardBody}>
                            <div className={estilos.infoItem}>
                                <label>Tipo de Obra</label>
                                <p>{formatearTipoObra(obra.tipo || obra.tipo_obra)}</p>
                            </div>
                            <div className={estilos.infoItem}>
                                <label>Ubicación</label>
                                <p>{obra.ubicacion || 'No especificada'}</p>
                            </div>
                            {obra.zona && (
                                <div className={estilos.infoItem}>
                                    <label>Zona</label>
                                    <p>{obra.zona}</p>
                                </div>
                            )}
                            {obra.municipio && (
                                <div className={estilos.infoItem}>
                                    <label>Municipio</label>
                                    <p>{obra.municipio}</p>
                                </div>
                            )}
                            {obra.provincia && (
                                <div className={estilos.infoItem}>
                                    <label>Provincia</label>
                                    <p>{obra.provincia}</p>
                                </div>
                            )}
                            {obra.descripcion && (
                                <div className={estilos.infoItem}>
                                    <label>Descripción</label>
                                    <p className={estilos.descripcion}>{obra.descripcion}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Columna Derecha - Presupuesto y Cronograma */}
                    <div className={`${estilos.card} ${estilos.cardPresupuesto}`}>
                        <div className={estilos.cardHeader}>
                            <h2>
                                <ion-icon name="cash-outline"></ion-icon>
                                Presupuesto y Cronograma
                            </h2>
                        </div>
                        <div className={estilos.cardBody}>
                            <div className={estilos.seccionPresupuesto}>
                                <h3>Presupuesto</h3>
                                <div className={estilos.infoItem}>
                                    <label>Presupuesto Aprobado</label>
                                    <p className={estilos.monto}>{formatearMoneda(obra.presupuesto_aprobado || 0)}</p>
                                </div>
                                <div className={estilos.infoItem}>
                                    <label>Costo Ejecutado</label>
                                    <p className={estilos.monto}>{formatearMoneda(obra.costo_real || obra.costo_ejecutado || 0)}</p>
                                </div>
                                <div className={estilos.infoItem}>
                                    <label>Saldo Restante</label>
                                    <p className={`${estilos.monto} ${saldoRestante < 0 ? estilos.montoNegativo : ''}`}>
                                        {formatearMoneda(saldoRestante)}
                                    </p>
                                </div>
                                {porcentajeEjecutado >= 70 && (
                                    <div className={`${estilos.alertaCard} ${estilos[getProgresoColor()]}`}>
                                        <ion-icon name="warning-outline"></ion-icon>
                                        <span>
                                            {porcentajeEjecutado >= 90 
                                                ? 'Presupuesto crítico: ' 
                                                : 'Atención: '}
                                            {porcentajeEjecutado.toFixed(1)}% ejecutado
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className={estilos.seccionCronograma}>
                                <h3>Cronograma</h3>
                                <div className={estilos.infoItem}>
                                    <label>Fecha de Inicio</label>
                                    <p>{formatearFecha(obra.fecha_inicio)}</p>
                                </div>
                                <div className={estilos.infoItem}>
                                    <label>Fecha de Fin Estimada</label>
                                    <p>{formatearFecha(obra.fecha_fin_estimada)}</p>
                                </div>
                                {diasRestantes !== null && (
                                    <div className={estilos.infoItem}>
                                        <label>Días Restantes</label>
                                        <p className={diasRestantes < 0 ? estilos.diasVencidos : diasRestantes < 7 ? estilos.diasAtencion : ''}>
                                            {diasRestantes > 0 ? `${diasRestantes} días` : 'Vencido'}
                                        </p>
                                    </div>
                                )}
                                {obra.fecha_creacion && (
                                    <div className={estilos.infoItem}>
                                        <label>Fecha de Creación</label>
                                        <p>{formatearFecha(obra.fecha_creacion)}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile: Contenido por Tabs */}
                <div className={estilos.contenidoMobile}>
                    {tabActivo === 'resumen' && (
                        <div className={estilos.card}>
                            <div className={estilos.cardHeader}>
                                <h2>Información General</h2>
                            </div>
                            <div className={estilos.cardBody}>
                                <div className={estilos.infoItem}>
                                    <label>Tipo de Obra</label>
                                    <p>{formatearTipoObra(obra.tipo || obra.tipo_obra)}</p>
                                </div>
                                <div className={estilos.infoItem}>
                                    <label>Ubicación</label>
                                    <p>{obra.ubicacion || 'No especificada'}</p>
                                </div>
                                {obra.zona && (
                                    <div className={estilos.infoItem}>
                                        <label>Zona</label>
                                        <p>{obra.zona}</p>
                                    </div>
                                )}
                                {obra.descripcion && (
                                    <div className={estilos.infoItem}>
                                        <label>Descripción</label>
                                        <p className={estilos.descripcion}>{obra.descripcion}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {tabActivo === 'presupuesto' && (
                        <div className={estilos.card}>
                            <div className={estilos.cardHeader}>
                                <h2>Presupuesto</h2>
                            </div>
                            <div className={estilos.cardBody}>
                                <div className={estilos.infoItem}>
                                    <label>Presupuesto Aprobado</label>
                                    <p className={estilos.monto}>{formatearMoneda(obra.presupuesto_aprobado || 0)}</p>
                                </div>
                                <div className={estilos.infoItem}>
                                    <label>Costo Ejecutado</label>
                                    <p className={estilos.monto}>{formatearMoneda(obra.costo_real || obra.costo_ejecutado || 0)}</p>
                                </div>
                                <div className={estilos.infoItem}>
                                    <label>Saldo Restante</label>
                                    <p className={`${estilos.monto} ${saldoRestante < 0 ? estilos.montoNegativo : ''}`}>
                                        {formatearMoneda(saldoRestante)}
                                    </p>
                                </div>
                                {porcentajeEjecutado >= 70 && (
                                    <div className={`${estilos.alertaCard} ${estilos[getProgresoColor()]}`}>
                                        <ion-icon name="warning-outline"></ion-icon>
                                        <span>
                                            {porcentajeEjecutado >= 90 
                                                ? 'Presupuesto crítico: ' 
                                                : 'Atención: '}
                                            {porcentajeEjecutado.toFixed(1)}% ejecutado
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {tabActivo === 'fechas' && (
                        <div className={estilos.card}>
                            <div className={estilos.cardHeader}>
                                <h2>Cronograma</h2>
                            </div>
                            <div className={estilos.cardBody}>
                                <div className={estilos.infoItem}>
                                    <label>Fecha de Inicio</label>
                                    <p>{formatearFecha(obra.fecha_inicio)}</p>
                                </div>
                                <div className={estilos.infoItem}>
                                    <label>Fecha de Fin Estimada</label>
                                    <p>{formatearFecha(obra.fecha_fin_estimada)}</p>
                                </div>
                                {diasRestantes !== null && (
                                    <div className={estilos.infoItem}>
                                        <label>Días Restantes</label>
                                        <p className={diasRestantes < 0 ? estilos.diasVencidos : diasRestantes < 7 ? estilos.diasAtencion : ''}>
                                            {diasRestantes > 0 ? `${diasRestantes} días` : 'Vencido'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {tabActivo === 'responsables' && (
                        <div className={estilos.card}>
                            <div className={estilos.cardHeader}>
                                <h2>Responsables</h2>
                            </div>
                            <div className={estilos.cardBody}>
                                {obra.cliente_nombre && (
                                    <div className={estilos.infoItem}>
                                        <label>Cliente</label>
                                        <p>{obra.cliente_nombre}</p>
                                    </div>
                                )}
                                {obra.responsable_nombre && (
                                    <div className={estilos.infoItem}>
                                        <label>Responsable</label>
                                        <p>{obra.responsable_nombre}</p>
                                    </div>
                                )}
                                {!obra.cliente_nombre && !obra.responsable_nombre && (
                                    <p className={estilos.sinDatos}>No hay responsables asignados</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Responsables (Desktop) */}
            {(obra.cliente_nombre || obra.responsable_nombre) && (
                <section className={estilos.responsablesSection}>
                    <div className={estilos.card}>
                        <div className={estilos.cardHeader}>
                            <h2>
                                <ion-icon name="people-outline"></ion-icon>
                                Responsables
                            </h2>
                        </div>
                        <div className={estilos.cardBody}>
                            <div className={estilos.gridResponsables}>
                                {obra.cliente_nombre && (
                                    <div className={estilos.responsableItem}>
                                        <div className={estilos.responsableIcono}>
                                            <ion-icon name="person-outline"></ion-icon>
                                        </div>
                                        <div className={estilos.responsableInfo}>
                                            <label>Cliente</label>
                                            <p>{obra.cliente_nombre}</p>
                                        </div>
                                    </div>
                                )}
                                {obra.responsable_nombre && (
                                    <div className={estilos.responsableItem}>
                                        <div className={estilos.responsableIcono}>
                                            <ion-icon name="briefcase-outline"></ion-icon>
                                        </div>
                                        <div className={estilos.responsableInfo}>
                                            <label>Responsable</label>
                                            <p>{obra.responsable_nombre}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* FAB Mobile */}
            <button 
                className={estilos.fab}
                onClick={() => router.push(`/admin/obras/editar/${id}`)}
                aria-label="Editar obra"
            >
                <ion-icon name="create-outline"></ion-icon>
            </button>
        </div>
    )
}
