"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { obtenerDashboardEquipos } from './servidor'
import { ImagenProducto } from '@/utils/imageUtils'
import estilos from './equipos.module.css'

export default function EquiposAdmin() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [estadisticas, setEstadisticas] = useState({
        total_equipos: 0,
        equipos_activos: 0,
        total_activos_disponibles: 0,
        total_activos_financiados: 0,
        total_activos_vendidos: 0,
        total_activos: 0,
        valor_inventario: 0
    })
    const [equiposRecientes, setEquiposRecientes] = useState([])
    const [equiposDestacados, setEquiposDestacados] = useState([])
    const [datosFinanciamiento, setDatosFinanciamiento] = useState({
        contratos_activos: 0,
        cuotas_pendientes: 0,
        cuotas_vencidas: 0,
        monto_por_cobrar: 0,
        contratos_recientes: []
    })

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
        cargarDashboard()
    }, [])

    const cargarDashboard = async () => {
        setCargando(true)
        try {
            const resultado = await obtenerDashboardEquipos()
            if (resultado.success) {
                setEstadisticas(resultado.estadisticas || {})
                setEquiposRecientes(resultado.equiposRecientes || [])
                setEquiposDestacados(resultado.equiposDestacados || [])
                setDatosFinanciamiento(resultado.datosFinanciamiento || {
                    contratos_activos: 0,
                    cuotas_pendientes: 0,
                    cuotas_vencidas: 0,
                    monto_por_cobrar: 0,
                    contratos_recientes: []
                })
            } else {
                alert(resultado.mensaje || 'Error al cargar dashboard')
            }
        } catch (error) {
            console.error('Error al cargar dashboard:', error)
            alert('Error al cargar datos')
        } finally {
            setCargando(false)
        }
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2
        }).format(monto || 0)
    }

    const obtenerEtiquetaTipoActivo = (tipo) => {
        const tipos = {
            'vehiculo': 'Vehículo',
            'electronico': 'Electrónico',
            'electrodomestico': 'Electrodoméstico',
            'mueble': 'Mueble',
            'otro': 'Otro'
        }
        return tipos[tipo] || tipo
    }

    const formatearFecha = (fecha) => {
        if (!fecha) return 'N/A'
        return new Date(fecha).toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    // Calcular porcentajes para gráficas
    const calcularPorcentajes = () => {
        const total = estadisticas.total_activos || 1
        return {
            disponibles: ((estadisticas.total_activos_disponibles / total) * 100).toFixed(1),
            financiados: ((estadisticas.total_activos_financiados / total) * 100).toFixed(1),
            vendidos: ((estadisticas.total_activos_vendidos / total) * 100).toFixed(1)
        }
    }

    const porcentajes = calcularPorcentajes()

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando dashboard...</span>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* Header */}
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Dashboard de Equipos</h1>
                    <p className={estilos.subtitulo}>Vista general de inventario, financiamiento y operaciones</p>
                </div>
                <div className={estilos.headerAcciones}>
                    <Link href="/admin/equipos/listar" className={estilos.btnListar}>
                        <ion-icon name="list-outline"></ion-icon>
                        <span>Ver Todos</span>
                    </Link>
                    <Link href="/admin/equipos/nuevo" className={estilos.btnNuevo}>
                        <ion-icon name="add-circle-outline"></ion-icon>
                        <span>Nuevo Equipo</span>
                    </Link>
                </div>
            </div>

            {/* 1. Tarjetas principales de estadísticas */}
            <div className={`${estilos.estadisticas} ${estilos[tema]}`}>
                <div className={`${estilos.estadCard} ${estilos.primary}`}>
                    <div className={estilos.estadIconoWrapper}>
                        <div className={`${estilos.estadIcono} ${estilos.primary}`}>
                            <ion-icon name="cube-outline"></ion-icon>
                        </div>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Total Equipos</span>
                        <span className={estilos.estadValor}>{estadisticas.total_equipos || 0}</span>
                        <span className={estilos.estadTendencia}>
                            <ion-icon name="trending-up-outline"></ion-icon>
                            Tipos de productos
                        </span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos.success}`}>
                    <div className={estilos.estadIconoWrapper}>
                        <div className={`${estilos.estadIcono} ${estilos.success}`}>
                            <ion-icon name="checkmark-circle-outline"></ion-icon>
                        </div>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Equipos Activos</span>
                        <span className={estilos.estadValor}>{estadisticas.equipos_activos || 0}</span>
                        <span className={estilos.estadTendencia}>
                            <ion-icon name="pulse-outline"></ion-icon>
                            En catálogo
                        </span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos.info}`}>
                    <div className={estilos.estadIconoWrapper}>
                        <div className={`${estilos.estadIcono} ${estilos.info}`}>
                            <ion-icon name="layers-outline"></ion-icon>
                        </div>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Total Unidades</span>
                        <span className={estilos.estadValor}>{estadisticas.total_activos || 0}</span>
                        <span className={estilos.estadTendencia}>
                            <ion-icon name="bar-chart-outline"></ion-icon>
                            Activos totales
                        </span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos.warning}`}>
                    <div className={estilos.estadIconoWrapper}>
                        <div className={`${estilos.estadIcono} ${estilos.warning}`}>
                            <ion-icon name="cash-outline"></ion-icon>
                        </div>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Valor Inventario</span>
                        <span className={estilos.estadValor}>{formatearMoneda(estadisticas.valor_inventario)}</span>
                        <span className={estilos.estadTendencia}>
                            <ion-icon name="trending-up-outline"></ion-icon>
                            Disponibles
                        </span>
                    </div>
                </div>
            </div>

            {/* 2. Grid principal: Distribución de activos y Equipos recientes */}
            <div className={estilos.gridPrincipal}>
                {/* 2.1 Gráfica de distribución */}
                <div className={`${estilos.cardGrafica} ${estilos[tema]}`}>
                    <div className={estilos.cardGraficaHeader}>
                        <div>
                            <h3 className={estilos.cardGraficaTitulo}>Distribución de Activos</h3>
                            <p className={estilos.cardGraficaSubtitulo}>Estado actual de todas las unidades</p>
                        </div>
                    </div>

                    {/* Gráfica de dona (circular) */}
                    <div className={estilos.graficaCircular}>
                        <svg className={estilos.donaChart} viewBox="0 0 200 200">
                            <circle
                                cx="100"
                                cy="100"
                                r="80"
                                fill="none"
                                stroke={tema === 'light' ? '#f1f5f9' : '#0f172a'}
                                strokeWidth="40"
                            />
                            {/* Disponibles - Verde */}
                            <circle
                                cx="100"
                                cy="100"
                                r="80"
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="40"
                                strokeDasharray={`${(porcentajes.disponibles * 5.024).toFixed(2)} 502.4`}
                                strokeDashoffset="0"
                                className={estilos.donaSegmento}
                            />
                            {/* Financiados - Naranja */}
                            <circle
                                cx="100"
                                cy="100"
                                r="80"
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth="40"
                                strokeDasharray={`${(porcentajes.financiados * 5.024).toFixed(2)} 502.4`}
                                strokeDashoffset={`-${(porcentajes.disponibles * 5.024).toFixed(2)}`}
                                className={estilos.donaSegmento}
                            />
                            {/* Vendidos - Azul */}
                            <circle
                                cx="100"
                                cy="100"
                                r="80"
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="40"
                                strokeDasharray={`${(porcentajes.vendidos * 5.024).toFixed(2)} 502.4`}
                                strokeDashoffset={`-${((parseFloat(porcentajes.disponibles) + parseFloat(porcentajes.financiados)) * 5.024).toFixed(2)}`}
                                className={estilos.donaSegmento}
                            />
                            <text x="100" y="95" textAnchor="middle" className={estilos.donaTextoValor}>
                                {estadisticas.total_activos || 0}
                            </text>
                            <text x="100" y="115" textAnchor="middle" className={estilos.donaTextoLabel}>
                                Unidades
                            </text>
                        </svg>

                        <div className={estilos.leyendaCircular}>
                            <div className={estilos.leyendaItem}>
                                <div className={`${estilos.leyendaDot} ${estilos.disponibles}`}></div>
                                <div className={estilos.leyendaInfo}>
                                    <span className={estilos.leyendaLabel}>Disponibles</span>
                                    <span className={estilos.leyendaValor}>{estadisticas.total_activos_disponibles || 0}</span>
                                </div>
                                <span className={estilos.leyendaPorcentaje}>{porcentajes.disponibles}%</span>
                            </div>
                            <div className={estilos.leyendaItem}>
                                <div className={`${estilos.leyendaDot} ${estilos.financiados}`}></div>
                                <div className={estilos.leyendaInfo}>
                                    <span className={estilos.leyendaLabel}>Financiados</span>
                                    <span className={estilos.leyendaValor}>{estadisticas.total_activos_financiados || 0}</span>
                                </div>
                                <span className={estilos.leyendaPorcentaje}>{porcentajes.financiados}%</span>
                            </div>
                            <div className={estilos.leyendaItem}>
                                <div className={`${estilos.leyendaDot} ${estilos.vendidos}`}></div>
                                <div className={estilos.leyendaInfo}>
                                    <span className={estilos.leyendaLabel}>Vendidos</span>
                                    <span className={estilos.leyendaValor}>{estadisticas.total_activos_vendidos || 0}</span>
                                </div>
                                <span className={estilos.leyendaPorcentaje}>{porcentajes.vendidos}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Análisis de inventario y rendimiento */}
                    <div className={estilos.analisisContainer}>
                        <div className={estilos.analisisItem}>
                            <div className={estilos.analisisHeader}>
                                <ion-icon name="analytics-outline"></ion-icon>
                                <span>Tasa de Disponibilidad</span>
                            </div>
                            <div className={estilos.analisisBarraContainer}>
                                <div 
                                    className={`${estilos.analisisBarra} ${estilos.success}`}
                                    style={{ width: `${porcentajes.disponibles}%` }}
                                >
                                    <span className={estilos.analisisBarraPorcentaje}>{porcentajes.disponibles}%</span>
                                </div>
                            </div>
                        </div>

                        <div className={estilos.analisisItem}>
                            <div className={estilos.analisisHeader}>
                                <ion-icon name="wallet-outline"></ion-icon>
                                <span>Valor Promedio por Unidad</span>
                            </div>
                            <div className={estilos.analisisValor}>
                                {formatearMoneda(
                                    estadisticas.total_activos_disponibles > 0 
                                        ? estadisticas.valor_inventario / estadisticas.total_activos_disponibles 
                                        : 0
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2.2 Tabla de equipos recientes */}
                <div className={`${estilos.cardTablaRecientes} ${estilos[tema]}`}>
                    <div className={estilos.cardTablaRecientesHeader}>
                        <div>
                            <h3 className={estilos.cardTablaTitulo}>
                                <ion-icon name="time-outline"></ion-icon>
                                Equipos Recientes
                            </h3>
                            <p className={estilos.cardTablaSubtitulo}>Últimos equipos agregados</p>
                        </div>
                    </div>

                    {equiposRecientes.length === 0 ? (
                        <div className={estilos.tablaVacia}>
                            <ion-icon name="cube-outline"></ion-icon>
                            <span>No hay equipos recientes</span>
                        </div>
                    ) : (
                        <div className={estilos.tablaSimple}>
                            {equiposRecientes.slice(0, 5).map((equipo) => (
                                <div
                                    key={equipo.id}
                                    className={estilos.filaEquipo}
                                >
                                    <div className={estilos.equipoImagenContainer}>
                                        <ImagenProducto
                                            src={equipo.imagen_url}
                                            alt={equipo.nombre}
                                            className={estilos.equipoImagen}
                                            placeholder={true}
                                            placeholderClassName={estilos.equipoImagenPlaceholder}
                                        />
                                    </div>
                                    <Link
                                        href={`/admin/equipos/ver/${equipo.id}`}
                                        className={estilos.equipoInfo}
                                    >
                                        <span className={estilos.equipoNombre}>{equipo.nombre}</span>
                                        <span className={estilos.equipoCategoria}>
                                            {equipo.categoria_nombre || 'Sin categoría'}
                                        </span>
                                    </Link>
                                    <div className={estilos.equipoPrecio}>
                                        {formatearMoneda(equipo.precio_venta)}
                                    </div>
                                    <div className={estilos.equipoStock}>
                                        <span className={`${estilos.stockBadgeSimple} ${equipo.activos_disponibles > 0 ? estilos.disponible : estilos.agotado}`}>
                                            {equipo.activos_disponibles || 0} unidades
                                        </span>
                                    </div>
                                    <div className={estilos.accionesFilaEquipo}>
                                        <Link
                                            href={`/admin/equipos/ver/${equipo.id}`}
                                            className={estilos.btnVerEquipo}
                                            title="Ver detalles"
                                        >
                                            <ion-icon name="eye-outline"></ion-icon>
                                        </Link>
                                        <Link
                                            href={`/admin/equipos/ver/${equipo.id}?accion=agregar`}
                                            className={estilos.btnAgregarActivo}
                                            title="Agregar activo"
                                        >
                                            <ion-icon name="add-circle-outline"></ion-icon>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <Link href="/admin/equipos/listar" className={estilos.btnVerTodosEquipos}>
                        <span>Ver Todos los Equipos</span>
                        <ion-icon name="arrow-forward-outline"></ion-icon>
                    </Link>
                </div>
            </div>

            {/* 3. Sección de Financiamiento */}
            <div className={estilos.seccionFinanciamiento}>
                <h2 className={estilos.seccionTitulo}>
                    <ion-icon name="card-outline"></ion-icon>
                    <span>Financiamiento y Contratos</span>
                </h2>

                {/* Métricas de financiamiento */}
                <div className={estilos.metricasFinanciamiento}>
                    <div className={`${estilos.metricaCard} ${estilos[tema]}`}>
                        <div className={estilos.metricaIcono}>
                            <ion-icon name="document-text-outline"></ion-icon>
                        </div>
                        <div className={estilos.metricaDetalle}>
                            <span className={estilos.metricaLabel}>Contratos Activos</span>
                            <span className={estilos.metricaValor}>{datosFinanciamiento.contratos_activos || 0}</span>
                        </div>
                    </div>

                    <div className={`${estilos.metricaCard} ${estilos[tema]}`}>
                        <div className={estilos.metricaIcono}>
                            <ion-icon name="calendar-outline"></ion-icon>
                        </div>
                        <div className={estilos.metricaDetalle}>
                            <span className={estilos.metricaLabel}>Cuotas Pendientes</span>
                            <span className={estilos.metricaValor}>{datosFinanciamiento.cuotas_pendientes || 0}</span>
                        </div>
                    </div>

                    <div className={`${estilos.metricaCard} ${estilos.alerta} ${estilos[tema]}`}>
                        <div className={estilos.metricaIcono}>
                            <ion-icon name="warning-outline"></ion-icon>
                        </div>
                        <div className={estilos.metricaDetalle}>
                            <span className={estilos.metricaLabel}>Cuotas Vencidas</span>
                            <span className={estilos.metricaValor}>{datosFinanciamiento.cuotas_vencidas || 0}</span>
                        </div>
                    </div>

                    <div className={`${estilos.metricaCard} ${estilos[tema]}`}>
                        <div className={estilos.metricaIcono}>
                            <ion-icon name="cash-outline"></ion-icon>
                        </div>
                        <div className={estilos.metricaDetalle}>
                            <span className={estilos.metricaLabel}>Por Cobrar</span>
                            <span className={estilos.metricaValor}>{formatearMoneda(datosFinanciamiento.monto_por_cobrar)}</span>
                        </div>
                    </div>
                </div>

                {/* Alertas y contratos recientes */}
                <div className={estilos.gridFinanciamiento}>
                    {/* Alertas de cuotas */}
                    {datosFinanciamiento.cuotas_vencidas > 0 && (
                        <div className={`${estilos.cardAlertas} ${estilos[tema]}`}>
                            <div className={estilos.cardAlertasHeader}>
                                <ion-icon name="alert-circle-outline"></ion-icon>
                                <h3 className={estilos.cardAlertasTitulo}>Alertas de Cobranza</h3>
                            </div>
                            <div className={estilos.alertaContenido}>
                                <div className={estilos.alertaItem}>
                                    <div className={estilos.alertaIcono}>
                                        <ion-icon name="time-outline"></ion-icon>
                                    </div>
                                    <div className={estilos.alertaInfo}>
                                        <span className={estilos.alertaTitulo}>Cuotas Vencidas</span>
                                        <span className={estilos.alertaDescripcion}>
                                            {datosFinanciamiento.cuotas_vencidas} cuotas requieren atención inmediata
                                        </span>
                                    </div>
                                    <Link href="/admin/cuotas" className={estilos.alertaBoton}>
                                        <ion-icon name="arrow-forward-outline"></ion-icon>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Resumen de contratos */}
                    <div className={`${estilos.cardContratos} ${estilos[tema]}`}>
                        <div className={estilos.cardContratosHeader}>
                            <h3 className={estilos.cardContratosTitulo}>
                                <ion-icon name="document-outline"></ion-icon>
                                Contratos Recientes
                            </h3>
                            <Link href="/admin/contratos" className={estilos.verTodosLink}>
                                Ver todos
                            </Link>
                        </div>
                        {datosFinanciamiento.contratos_recientes && datosFinanciamiento.contratos_recientes.length > 0 ? (
                            <div className={estilos.listaContratos}>
                                {datosFinanciamiento.contratos_recientes.slice(0, 4).map((contrato) => (
                                    <Link
                                        key={contrato.id}
                                        href={`/admin/contratos/ver/${contrato.id}`}
                                        className={estilos.itemContrato}
                                    >
                                        <div className={estilos.contratoInfo}>
                                            <span className={estilos.contratoNumero}>{contrato.numero_contrato}</span>
                                            <span className={estilos.contratoCliente}>{contrato.cliente_nombre}</span>
                                        </div>
                                        <div className={estilos.contratoMonto}>
                                            <span className={estilos.contratoMontoValor}>
                                                {formatearMoneda(contrato.saldo_pendiente)}
                                            </span>
                                            <span className={estilos.contratoMontoLabel}>pendiente</span>
                                        </div>
                                        <div className={`${estilos.contratoEstado} ${estilos[contrato.estado]}`}>
                                            {contrato.estado}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className={estilos.contratosVacio}>
                                <ion-icon name="document-outline"></ion-icon>
                                <span>No hay contratos activos</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mensaje si no hay equipos */}
            {equiposDestacados.length === 0 && equiposRecientes.length === 0 && (
                <div className={`${estilos.vacio} ${estilos[tema]}`}>
                    <div className={estilos.vacioIcono}>
                        <ion-icon name="cube-outline"></ion-icon>
                    </div>
                    <h3 className={estilos.vacioTitulo}>No hay equipos registrados</h3>
                    <p className={estilos.vacioTexto}>Comienza agregando tu primer equipo al inventario</p>
                    <Link href="/admin/equipos/nuevo" className={estilos.btnNuevoVacio}>
                        <ion-icon name="add-circle-outline"></ion-icon>
                        <span>Crear Primer Equipo</span>
                    </Link>
                </div>
            )}
        </div>
    )
}
