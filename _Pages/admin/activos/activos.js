"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { obtenerDashboardActivos } from './servidor'
import { ImagenProducto } from '@/utils/imageUtils'
import estilos from './activos.module.css'

export default function ActivosAdmin() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [estadisticas, setEstadisticas] = useState({
        total_activos: 0,
        activos_en_stock: 0,
        activos_financiados: 0,
        activos_vendidos: 0,
        activos_asignados: 0,
        activos_devueltos: 0,
        activos_mantenimiento: 0,
        activos_dado_baja: 0,
        valor_inventario: 0,
        total_inversion: 0,
        total_ventas: 0
    })
    const [activosRecientes, setActivosRecientes] = useState([])
    const [activosDestacados, setActivosDestacados] = useState([])
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
            const resultado = await obtenerDashboardActivos()
            if (resultado.success) {
                setEstadisticas(resultado.estadisticas || {})
                setActivosRecientes(resultado.activosRecientes || [])
                setActivosDestacados(resultado.activosDestacados || [])
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

    const obtenerEtiquetaEstado = (estado) => {
        const estados = {
            'en_stock': 'En Stock',
            'vendido': 'Vendido',
            'financiado': 'Financiado',
            'asignado': 'Asignado',
            'devuelto': 'Devuelto',
            'mantenimiento': 'Mantenimiento',
            'dado_baja': 'Dado de Baja'
        }
        return estados[estado] || estado
    }

    const obtenerTextoEstado = (estado) => {
        return obtenerEtiquetaEstado(estado)
    }

    const obtenerColorEstado = (estado) => {
        const colores = {
            en_stock: 'success',
            vendido: 'info',
            financiado: 'warning',
            asignado: 'info',
            devuelto: 'secondary',
            mantenimiento: 'warning',
            dado_baja: 'danger'
        }
        return colores[estado] || 'secondary'
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
            en_stock: ((estadisticas.activos_en_stock / total) * 100).toFixed(1),
            financiados: ((estadisticas.activos_financiados / total) * 100).toFixed(1),
            vendidos: ((estadisticas.activos_vendidos / total) * 100).toFixed(1)
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
                    <h1 className={estilos.titulo}>Dashboard de Activos</h1>
                    <p className={estilos.subtitulo}>Vista general de unidades físicas, financiamiento y operaciones</p>
                </div>
                <div className={estilos.headerAcciones}>
                    <Link href="/admin/activos/listar" className={estilos.btnListar}>
                        <ion-icon name="list-outline"></ion-icon>
                        <span>Ver Todas las Unidades</span>
                    </Link>
                    <Link href="/admin/activos/nuevo" className={estilos.btnNuevo}>
                        <ion-icon name="add-circle-outline"></ion-icon>
                        <span>Nueva Unidad</span>
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
                        <span className={estilos.estadLabel}>Total Activos</span>
                        <span className={estilos.estadValor}>{estadisticas.total_activos || 0}</span>
                        <span className={estilos.estadTendencia}>
                            <ion-icon name="trending-up-outline"></ion-icon>
                            Unidades físicas
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
                        <span className={estilos.estadLabel}>En Stock</span>
                        <span className={estilos.estadValor}>{estadisticas.activos_en_stock || 0}</span>
                        <span className={estilos.estadTendencia}>
                            <ion-icon name="pulse-outline"></ion-icon>
                            Disponibles
                        </span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos.info}`}>
                    <div className={estilos.estadIconoWrapper}>
                        <div className={`${estilos.estadIcono} ${estilos.info}`}>
                            <ion-icon name="cash-outline"></ion-icon>
                        </div>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Valor Inventario</span>
                        <span className={estilos.estadValor}>{formatearMoneda(estadisticas.valor_inventario)}</span>
                        <span className={estilos.estadTendencia}>
                            <ion-icon name="trending-up-outline"></ion-icon>
                            En stock
                        </span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos.warning}`}>
                    <div className={estilos.estadIconoWrapper}>
                        <div className={`${estilos.estadIcono} ${estilos.warning}`}>
                            <ion-icon name="card-outline"></ion-icon>
                        </div>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Financiados</span>
                        <span className={estilos.estadValor}>{estadisticas.activos_financiados || 0}</span>
                        <span className={estilos.estadTendencia}>
                            <ion-icon name="bar-chart-outline"></ion-icon>
                            Con contrato
                        </span>
                    </div>
                </div>
            </div>

            {/* 2. Grid principal: Distribución de activos y Activos recientes */}
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
                            {/* En Stock - Verde */}
                            <circle
                                cx="100"
                                cy="100"
                                r="80"
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="40"
                                strokeDasharray={`${(porcentajes.en_stock * 5.024).toFixed(2)} 502.4`}
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
                                strokeDashoffset={`-${(porcentajes.en_stock * 5.024).toFixed(2)}`}
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
                                strokeDashoffset={`-${((parseFloat(porcentajes.en_stock) + parseFloat(porcentajes.financiados)) * 5.024).toFixed(2)}`}
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
                                    <span className={estilos.leyendaLabel}>En Stock</span>
                                    <span className={estilos.leyendaValor}>{estadisticas.activos_en_stock || 0}</span>
                                </div>
                                <span className={estilos.leyendaPorcentaje}>{porcentajes.en_stock}%</span>
                            </div>
                            <div className={estilos.leyendaItem}>
                                <div className={`${estilos.leyendaDot} ${estilos.financiados}`}></div>
                                <div className={estilos.leyendaInfo}>
                                    <span className={estilos.leyendaLabel}>Financiados</span>
                                    <span className={estilos.leyendaValor}>{estadisticas.activos_financiados || 0}</span>
                                </div>
                                <span className={estilos.leyendaPorcentaje}>{porcentajes.financiados}%</span>
                            </div>
                            <div className={estilos.leyendaItem}>
                                <div className={`${estilos.leyendaDot} ${estilos.vendidos}`}></div>
                                <div className={estilos.leyendaInfo}>
                                    <span className={estilos.leyendaLabel}>Vendidos</span>
                                    <span className={estilos.leyendaValor}>{estadisticas.activos_vendidos || 0}</span>
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
                                    style={{ width: `${porcentajes.en_stock}%` }}
                                >
                                    <span className={estilos.analisisBarraPorcentaje}>{porcentajes.en_stock}%</span>
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
                                    estadisticas.activos_en_stock > 0 
                                        ? estadisticas.valor_inventario / estadisticas.activos_en_stock 
                                        : 0
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2.2 Tabla de activos recientes */}
                <div className={`${estilos.cardTablaRecientes} ${estilos[tema]}`}>
                    <div className={estilos.cardTablaRecientesHeader}>
                        <div>
                            <h3 className={estilos.cardTablaTitulo}>
                                <ion-icon name="time-outline"></ion-icon>
                                Activos Recientes
                            </h3>
                            <p className={estilos.cardTablaSubtitulo}>Últimos activos agregados</p>
                        </div>
                    </div>

                    {activosRecientes.length === 0 ? (
                        <div className={estilos.tablaVacia}>
                            <ion-icon name="cube-outline"></ion-icon>
                            <span>No hay activos recientes</span>
                        </div>
                    ) : (
                        <div className={estilos.tablaSimple}>
                            {activosRecientes.slice(0, 5).map((activo) => (
                                <div
                                    key={activo.id}
                                    className={estilos.filaEquipo}
                                >
                                    <div className={estilos.equipoImagenContainer}>
                                        <ImagenProducto
                                            src={activo.producto_imagen_url}
                                            alt={activo.producto_nombre}
                                            className={estilos.equipoImagen}
                                            placeholder={true}
                                            placeholderClassName={estilos.equipoImagenPlaceholder}
                                        />
                                    </div>
                                    <Link
                                        href={`/admin/activos/ver/${activo.id}`}
                                        className={estilos.equipoInfo}
                                    >
                                        <span className={estilos.equipoNombre}>{activo.producto_nombre}</span>
                                        <span className={estilos.equipoCategoria}>
                                            {activo.tipo_activo ? obtenerEtiquetaTipoActivo(activo.tipo_activo) : 'Sin tipo'}
                                        </span>
                                    </Link>
                                    <div className={estilos.equipoPrecio}>
                                        {formatearMoneda(activo.precio_compra)}
                                    </div>
                                    <div className={estilos.equipoStock}>
                                        <span className={`${estilos.stockBadgeSimple} ${activo.estado === 'en_stock' ? estilos.disponible : estilos.agotado}`}>
                                            {obtenerTextoEstado(activo.estado)}
                                        </span>
                                    </div>
                                    <div className={estilos.accionesFilaEquipo}>
                                        <Link
                                            href={`/admin/activos/ver/${activo.id}`}
                                            className={estilos.btnVerEquipo}
                                            title="Ver detalles"
                                        >
                                            <ion-icon name="eye-outline"></ion-icon>
                                        </Link>
                                        <Link
                                            href={`/admin/activos/editar/${activo.id}`}
                                            className={estilos.btnAgregarActivo}
                                            title="Editar activo"
                                        >
                                            <ion-icon name="create-outline"></ion-icon>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <Link href="/admin/activos/listar" className={estilos.btnVerTodosEquipos}>
                        <span>Ver Todas las Unidades</span>
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

            {/* Mensaje si no hay activos */}
            {activosDestacados.length === 0 && activosRecientes.length === 0 && (
                <div className={`${estilos.vacio} ${estilos[tema]}`}>
                    <div className={estilos.vacioIcono}>
                        <ion-icon name="cube-outline"></ion-icon>
                    </div>
                    <h3 className={estilos.vacioTitulo}>No hay unidades registradas</h3>
                    <p className={estilos.vacioTexto}>Comienza agregando tu primera unidad física al inventario</p>
                    <Link href="/admin/activos/nuevo" className={estilos.btnNuevoVacio}>
                        <ion-icon name="add-circle-outline"></ion-icon>
                        <span>Crear Primera Unidad</span>
                    </Link>
                </div>
            )}
        </div>
    )
}
