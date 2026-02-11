"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerObras } from './servidor'
import { ESTADOS_OBRA, formatearEstadoObra, formatearTipoObra } from '../../core/construction/estados'
import { calcularPorcentajeEjecutado, calcularDiasRestantes } from '../../core/construction/calculos'
import estilos from './listar.module.css'

export default function ObrasAdmin() {
    const router = useRouter()
    const [obras, setObras] = useState([])
    const [obrasFiltradas, setObrasFiltradas] = useState([])
    const [cargando, setCargando] = useState(true)
    const [tema, setTema] = useState('light')
    const [busqueda, setBusqueda] = useState('')
    const [filtroEstado, setFiltroEstado] = useState('todas')

    useEffect(() => {
        const t = localStorage.getItem('tema') || 'light'
        setTema(t)
        cargarObras()
    }, [])

    useEffect(() => {
        filtrarObras()
    }, [obras, busqueda, filtroEstado])

    async function cargarObras() {
        setCargando(true)
        const res = await obtenerObras()
        if (res.success) setObras(res.obras)
        setCargando(false)
    }

    function filtrarObras() {
        let filtradas = obras

        // Filtro por estado
        if (filtroEstado !== 'todas') {
            filtradas = filtradas.filter(o => o.estado === filtroEstado)
        }

        // Filtro por búsqueda
        if (busqueda) {
            const busquedaLower = busqueda.toLowerCase()
            filtradas = filtradas.filter(o => 
                o.nombre?.toLowerCase().includes(busquedaLower) ||
                o.codigo_obra?.toLowerCase().includes(busquedaLower) ||
                o.ubicacion?.toLowerCase().includes(busquedaLower)
            )
        }

        setObrasFiltradas(filtradas)
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div className={estilos.tituloArea}>
                    <h1 className={estilos.titulo}>
                        <ion-icon name="business-outline"></ion-icon>
                        Obras y Proyectos
                    </h1>
                    <p className={estilos.subtitulo}>Control de obras activas y presupuestos</p>
                </div>
                <div className={estilos.headerButtons}>
                    <button className={estilos.btnNuevo} onClick={() => router.push('/admin/obras/nuevo')}>
                        <ion-icon name="add-outline"></ion-icon>
                        <span>Nueva Obra</span>
                    </button>
                </div>
            </div>

            {/* Controles de Búsqueda y Filtros */}
            <div className={estilos.controles}>
                <div className={estilos.barraHerramientas}>
                    <div className={estilos.busqueda}>
                        <ion-icon name="search-outline"></ion-icon>
                        <input
                            type="text"
                            className={estilos.inputBusqueda}
                            placeholder="Buscar por nombre, código o ubicación..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>
                    <div className={estilos.filtrosContainer}>
                        <button className={estilos.btnFiltro}>
                            <ion-icon name="download-outline"></ion-icon>
                            <span>Exportar</span>
                        </button>
                    </div>
                </div>

                {/* Chips de Filtro por Estado */}
                <div className={estilos.chips}>
                    <button
                        className={`${estilos.chip} ${filtroEstado === 'todas' ? estilos.chipActivo : ''}`}
                        onClick={() => setFiltroEstado('todas')}
                    >
                        <ion-icon name="apps-outline"></ion-icon>
                        <span>Todas</span>
                    </button>
                    <button
                        className={`${estilos.chip} ${estilos.chipSuccess} ${filtroEstado === 'activa' ? estilos.chipActivo : ''}`}
                        onClick={() => setFiltroEstado('activa')}
                    >
                        <ion-icon name="checkmark-circle-outline"></ion-icon>
                        <span>Activas</span>
                    </button>
                    <button
                        className={`${estilos.chip} ${estilos.chipWarning} ${filtroEstado === 'suspendida' ? estilos.chipActivo : ''}`}
                        onClick={() => setFiltroEstado('suspendida')}
                    >
                        <ion-icon name="time-outline"></ion-icon>
                        <span>Suspendidas</span>
                    </button>
                    <button
                        className={`${estilos.chip} ${filtroEstado === 'finalizada' ? estilos.chipActivo : ''}`}
                        onClick={() => setFiltroEstado('finalizada')}
                    >
                        <ion-icon name="checkmark-done-outline"></ion-icon>
                        <span>Finalizadas</span>
                    </button>
                    <button
                        className={`${estilos.chip} ${estilos.chipDanger} ${filtroEstado === 'cancelada' ? estilos.chipActivo : ''}`}
                        onClick={() => setFiltroEstado('cancelada')}
                    >
                        <ion-icon name="close-circle-outline"></ion-icon>
                        <span>Canceladas</span>
                    </button>
                </div>
            </div>

            {cargando ? (
                <div className={estilos.cargando}>
                    <ion-icon name="refresh-outline" className={estilos.iconoCargando}></ion-icon>
                    <h3>Cargando proyectos...</h3>
                </div>
            ) : obrasFiltradas.length === 0 ? (
                <div className={estilos.vacio}>
                    <ion-icon name="business-outline"></ion-icon>
                    <h3>No se encontraron obras</h3>
                    <p>
                        {busqueda || filtroEstado !== 'todas' 
                            ? 'No hay obras que coincidan con los filtros seleccionados'
                            : 'No hay obras registradas. Crea tu primera obra para comenzar.'}
                    </p>
                    {!busqueda && filtroEstado === 'todas' && (
                        <button className={estilos.btnNuevo} onClick={() => router.push('/admin/obras/nuevo')}>
                            <ion-icon name="add-outline"></ion-icon>
                            <span>Crear Nueva Obra</span>
                        </button>
                    )}
                </div>
            ) : (
                <div className={estilos.grid}>
                    {obrasFiltradas.map(o => {
                        const estadoFormateado = formatearEstadoObra(o.estado || ESTADOS_OBRA.ACTIVA)
                        const porcentajeEjecutado = calcularPorcentajeEjecutado(
                            o.costo_real || o.costo_ejecutado || 0,
                            o.presupuesto_aprobado || 0
                        )
                        const diasRestantes = o.fecha_fin_estimada 
                            ? calcularDiasRestantes(o.fecha_fin_estimada)
                            : null
                        
                        const getProgresoColor = () => {
                            if (porcentajeEjecutado >= 90) return 'critico'
                            if (porcentajeEjecutado >= 70) return 'atencion'
                            return 'normal'
                        }

                        const getIconoEstado = () => {
                            const iconos = {
                                activa: 'checkmark-circle-outline',
                                suspendida: 'time-outline',
                                finalizada: 'checkmark-done-outline',
                                cancelada: 'close-circle-outline'
                            }
                            return iconos[o.estado] || 'ellipse-outline'
                        }

                        return (
                            <div key={o.id} className={estilos.tarjeta}>
                                <div className={estilos.tarjetaHeader}>
                                    <div>
                        {(o.codigo || o.codigo_obra) && (
                            <span className={estilos.codigoObra}>{o.codigo || o.codigo_obra}</span>
                        )}
                                        <h3>{o.nombre}</h3>
                                    </div>
                                    <div className={`${estilos.estado} ${estilos[estadoFormateado.color]}`}>
                                        <ion-icon name={getIconoEstado()}></ion-icon>
                                        <span>{estadoFormateado.texto}</span>
                                    </div>
                                </div>
                                
                                <div className={estilos.info}>
                                    <div className={estilos.itemInfo}>
                                        <ion-icon name="location-outline"></ion-icon>
                                        <span>{o.ubicacion || 'Sin ubicación'}</span>
                                    </div>
                                    {(o.tipo || o.tipo_obra) && (
                                        <div className={estilos.itemInfo}>
                                            <ion-icon name="construct-outline"></ion-icon>
                                            <span>{formatearTipoObra(o.tipo || o.tipo_obra)}</span>
                                        </div>
                                    )}
                                    {o.cliente_nombre && (
                                        <div className={estilos.itemInfo}>
                                            <ion-icon name="person-outline"></ion-icon>
                                            <span>{o.cliente_nombre}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Barra de Progreso Presupuestario */}
                                {porcentajeEjecutado > 0 && (
                                    <div className={estilos.progresoPresupuesto}>
                                        <div className={estilos.progresoHeader}>
                                            <span className={estilos.progresoLabel}>Ejecución Presupuestaria</span>
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
                                        <div className={estilos.progresoDetalles}>
                                            <span>
                                                Ejecutado: <strong>RD$ {parseFloat(o.costo_real || o.costo_ejecutado || 0).toLocaleString()}</strong>
                                            </span>
                                            <span>
                                                Presupuesto: <strong>RD$ {parseFloat(o.presupuesto_aprobado || 0).toLocaleString()}</strong>
                                            </span>
                                            <span>
                                                Restante: <strong>RD$ {parseFloat((o.presupuesto_aprobado || 0) - (o.costo_real || o.costo_ejecutado || 0)).toLocaleString()}</strong>
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Alerta de Presupuesto */}
                                {porcentajeEjecutado > 90 && o.estado === 'activa' && (
                                    <div className={`${estilos.alertaPresupuesto} ${estilos.critico}`}>
                                        <ion-icon name="warning-outline"></ion-icon>
                                        <p>Alerta: Esta obra ha superado el 90% del presupuesto</p>
                                    </div>
                                )}

                                <div className={estilos.footerCards}>
                                    <div className={estilos.fechas}>
                                        {o.fecha_inicio && (
                                            <small>
                                                <ion-icon name="calendar-outline" style={{ fontSize: '14px', marginRight: '4px' }}></ion-icon>
                                                Inicio: {new Date(o.fecha_inicio).toLocaleDateString()}
                                            </small>
                                        )}
                                        {diasRestantes !== null && (
                                            <small className={diasRestantes < 0 ? estilos.diasVencidos : ''}>
                                                <ion-icon name="time-outline" style={{ fontSize: '14px', marginRight: '4px' }}></ion-icon>
                                                {diasRestantes > 0 ? `${diasRestantes} días restantes` : 'Vencido'}
                                            </small>
                                        )}
                                    </div>
                                    <button 
                                        className={estilos.btnVer} 
                                        onClick={() => router.push(`/admin/obras/ver/${o.id}`)}
                                    >
                                        <ion-icon name="eye-outline"></ion-icon>
                                        <span>Ver Detalle</span>
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

        </div>
    )
}
