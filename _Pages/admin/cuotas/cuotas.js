"use client"
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { obtenerCuotas, obtenerEstadisticasCuotas } from './servidor'
import { calcularDiasAtraso } from '../core/finance/calculos'
import { ESTADOS_CUOTA, formatearEstadoCuota } from '../core/finance/estados'
import estilos from './cuotas.module.css'

export default function CuotasFinanciamiento() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [cuotas, setCuotas] = useState([])
    const [estadisticas, setEstadisticas] = useState(null)
    const [vistaActiva, setVistaActiva] = useState('tabla')
    const [tabActiva, setTabActiva] = useState('todas')
    const [paginacion, setPaginacion] = useState({
        pagina: 1,
        limite: 25,
        total: 0,
        totalPaginas: 1
    })
    const [filtros, setFiltros] = useState({
        estado: '',
        buscar: '',
        fecha_desde: '',
        fecha_hasta: '',
        vencidas: false,
        ordenar: 'vencimiento_asc'
    })
    const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)

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
        cargarDatos()
    }, [paginacion.pagina, filtros, tabActiva])

    const cargarDatos = async () => {
        setCargando(true)
        try {
            const estadoFiltro = tabActiva === 'todas' ? filtros.estado : 
                                 tabActiva === 'pendientes' ? 'pendiente' :
                                 tabActiva === 'vencidas' ? 'vencida' :
                                 tabActiva === 'pagadas' ? 'pagada' : filtros.estado

            const [resultadoCuotas, resultadoEstadisticas] = await Promise.all([
                obtenerCuotas({
                    pagina: paginacion.pagina,
                    limite: paginacion.limite,
                    estado: estadoFiltro || undefined,
                    buscar: filtros.buscar || undefined,
                    fecha_desde: filtros.fecha_desde || undefined,
                    fecha_hasta: filtros.fecha_hasta || undefined,
                    vencidas: filtros.vencidas || undefined
                }),
                obtenerEstadisticasCuotas({
                    fecha_desde: filtros.fecha_desde || undefined,
                    fecha_hasta: filtros.fecha_hasta || undefined
                })
            ])

            if (resultadoCuotas.success) {
                setCuotas(resultadoCuotas.cuotas)
                setPaginacion(prev => ({
                    ...prev,
                    ...resultadoCuotas.paginacion
                }))
            }

            if (resultadoEstadisticas.success) {
                setEstadisticas(resultadoEstadisticas.estadisticas)
            }
        } catch (error) {
            console.error('Error al cargar datos:', error)
        } finally {
            setCargando(false)
        }
    }

    const formatearFecha = (fecha) => {
        if (!fecha) return '-'
        return new Date(fecha).toLocaleDateString('es-DO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(monto || 0)
    }

    const formatearMonedaCorta = (monto) => {
        if (monto >= 1000000) {
            return `RD$ ${(monto / 1000000).toFixed(1)}M`
        }
        if (monto >= 1000) {
            return `RD$ ${(monto / 1000).toFixed(0)}K`
        }
        return formatearMoneda(monto)
    }

    const cambiarPagina = (nuevaPagina) => {
        if (nuevaPagina < 1 || nuevaPagina > paginacion.totalPaginas) return
        setPaginacion(prev => ({ ...prev, pagina: nuevaPagina }))
    }

    const manejarCambioFiltro = (e) => {
        const { name, value, type, checked } = e.target
        setFiltros(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
        setPaginacion(prev => ({ ...prev, pagina: 1 }))
    }

    const limpiarFiltros = () => {
        setFiltros({
            estado: '',
            buscar: '',
            fecha_desde: '',
            fecha_hasta: '',
            vencidas: false,
            ordenar: 'vencimiento_asc'
        })
        setTabActiva('todas')
        setPaginacion(prev => ({ ...prev, pagina: 1 }))
    }

    const obtenerPorcentajeProgreso = (pagadas, total) => {
        if (!total || total === 0) return 0
        return Math.round((pagadas / total) * 100)
    }

    const obtenerProximasCuotas = () => {
        if (!cuotas || cuotas.length === 0) return []
        const hoy = new Date()
        return cuotas
            .filter(c => c.estado === 'pendiente' || c.estado === 'vencida')
            .slice(0, 5)
            .map(cuota => {
                const fechaVenc = new Date(cuota.fecha_vencimiento)
                const diffDias = Math.ceil((fechaVenc - hoy) / (1000 * 60 * 60 * 24))
                let tipo = 'semana'
                if (diffDias <= 0) tipo = 'hoy'
                else if (diffDias <= 1) tipo = 'manana'
                return { ...cuota, tipo, diffDias }
            })
    }

    // Componente de carga
    if (cargando && cuotas.length === 0) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <div className={estilos.cargandoSpinner}></div>
                    <span>Cargando cuotas...</span>
                </div>
            </div>
        )
    }

    const proximasCuotas = obtenerProximasCuotas()

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* Header */}
            <header className={estilos.header}>
                <div className={estilos.headerInfo}>
                    <div className={estilos.headerIcono}>
                        <Image 
                            src="/financias/iconosv2/Recurring Deposit-Dollar.png" 
                            alt="Cuotas" 
                            width={32} 
                            height={32}
                        />
                    </div>
                    <div className={estilos.headerTexto}>
                        <p className={estilos.subtitulo}>Financiamiento</p>
                        <h1 className={estilos.titulo}>Cuotas de Financiamiento</h1>
                    </div>
                </div>
                <div className={estilos.headerAcciones}>
                    <Link href="/admin/contratos" className={estilos.btnSecundario}>
                        <ion-icon name="document-text-outline"></ion-icon>
                        <span>Contratos</span>
                    </Link>
                    <Link href="/admin/financiamiento" className={estilos.btnPrimario}>
                        <ion-icon name="stats-chart-outline"></ion-icon>
                        <span>Dashboard</span>
                    </Link>
                </div>
            </header>

            {/* Tarjetas Hero (Balance Principal) */}
            {estadisticas && (
                <section className={estilos.heroCards}>
                    {/* Tarjeta Principal - Total Financiado */}
                    <div className={`${estilos.heroCard} ${estilos.primary}`}>
                        <div className={estilos.heroIcono}>
                            <Image 
                                src="/financias/iconosv2/Money bag-Dollar.png" 
                                alt="Total" 
                                width={28} 
                                height={28}
                                style={{ filter: 'brightness(0) invert(1)' }}
                            />
                        </div>
                        <span className={estilos.heroLabel}>Total Financiado Activo</span>
                        <span className={estilos.heroValor}>
                            {formatearMonedaCorta(estadisticas.total_monto_cuotas || 0)}
                        </span>
                        <span className={`${estilos.heroTendencia} ${estilos.positivo}`}>
                            <ion-icon name="trending-up-outline"></ion-icon>
                            {estadisticas.total_cuotas || 0} cuotas activas
                        </span>
                    </div>

                    {/* Tarjeta Secundaria - Recaudado */}
                    <div className={`${estilos.heroCard} ${estilos.secondary}`}>
                        <div className={estilos.heroIcono}>
                            <Image 
                                src="/financias/iconosv2/Cashback Reward-Dollar.png" 
                                alt="Recaudado" 
                                width={28} 
                                height={28}
                            />
                        </div>
                        <span className={estilos.heroLabel}>Total Recaudado</span>
                        <span className={estilos.heroValor}>
                            {formatearMonedaCorta(estadisticas.total_monto_pagado || 0)}
                        </span>
                        <span className={`${estilos.heroTendencia} ${estilos.positivo}`}>
                            <ion-icon name="checkmark-circle-outline"></ion-icon>
                            {obtenerPorcentajeProgreso(estadisticas.cuotas_pagadas, estadisticas.total_cuotas)}% recuperado
                        </span>
                    </div>

                    {/* Tarjeta Terciaria - Por Cobrar */}
                    <div className={`${estilos.heroCard} ${estilos.success}`}>
                        <div className={estilos.heroIcono}>
                            <Image 
                                src="/financias/iconosv2/Wallet.png" 
                                alt="Por Cobrar" 
                                width={28} 
                                height={28}
                                style={{ filter: 'brightness(0) invert(1)' }}
                            />
                        </div>
                        <span className={estilos.heroLabel}>Pendiente por Cobrar</span>
                        <span className={estilos.heroValor}>
                            {formatearMonedaCorta((estadisticas.total_monto_cuotas || 0) - (estadisticas.total_monto_pagado || 0))}
                        </span>
                        <span className={`${estilos.heroTendencia} ${estilos.positivo}`}>
                            <ion-icon name="time-outline"></ion-icon>
                            {estadisticas.cuotas_pendientes || 0} cuotas pendientes
                        </span>
                    </div>
                </section>
            )}

            {/* Estadísticas Secundarias */}
            {estadisticas && (
                <section className={estilos.estadisticas}>
                    <div className={estilos.estadCard}>
                        <div className={estilos.estadIconoWrapper}>
                            <div className={`${estilos.estadIcono} ${estilos.primary}`}>
                                <Image 
                                    src="/financias/iconosv2/Analytics.png" 
                                    alt="Total" 
                                    width={28} 
                                    height={28}
                                />
                            </div>
                        </div>
                        <div className={estilos.estadInfo}>
                            <span className={estilos.estadLabel}>Total Cuotas</span>
                            <span className={estilos.estadValor}>{estadisticas.total_cuotas || 0}</span>
                        </div>
                    </div>

                    <div className={estilos.estadCard}>
                        <div className={estilos.estadIconoWrapper}>
                            <div className={`${estilos.estadIcono} ${estilos.success}`}>
                                <Image 
                                    src="/financias/iconosv2/KYC verified.png" 
                                    alt="Pagadas" 
                                    width={28} 
                                    height={28}
                                />
                            </div>
                        </div>
                        <div className={estilos.estadInfo}>
                            <span className={estilos.estadLabel}>Pagadas</span>
                            <span className={estilos.estadValor}>{estadisticas.cuotas_pagadas || 0}</span>
                            <span className={`${estilos.estadTendencia} ${estilos.positivo}`}>
                                <ion-icon name="arrow-up-outline"></ion-icon>
                                {obtenerPorcentajeProgreso(estadisticas.cuotas_pagadas, estadisticas.total_cuotas)}%
                            </span>
                        </div>
                    </div>

                    <div className={estilos.estadCard}>
                        <div className={estilos.estadIconoWrapper}>
                            <div className={`${estilos.estadIcono} ${estilos.warning}`}>
                                <Image 
                                    src="/financias/iconosv2/Bill Reminder-Dollar.png" 
                                    alt="Pendientes" 
                                    width={28} 
                                    height={28}
                                />
                            </div>
                        </div>
                        <div className={estilos.estadInfo}>
                            <span className={estilos.estadLabel}>Pendientes</span>
                            <span className={estilos.estadValor}>{estadisticas.cuotas_pendientes || 0}</span>
                        </div>
                    </div>

                    <div className={estilos.estadCard}>
                        <div className={estilos.estadIconoWrapper}>
                            <div className={`${estilos.estadIcono} ${estilos.danger}`}>
                                <Image 
                                    src="/financias/iconosv2/Fraud Alert.png" 
                                    alt="Vencidas" 
                                    width={28} 
                                    height={28}
                                />
                            </div>
                        </div>
                        <div className={estilos.estadInfo}>
                            <span className={estilos.estadLabel}>Vencidas</span>
                            <span className={estilos.estadValor}>{estadisticas.cuotas_vencidas_activas || 0}</span>
                            <span className={`${estilos.estadTendencia} ${estilos.negativo}`}>
                                <ion-icon name="warning-outline"></ion-icon>
                                Atención
                            </span>
                        </div>
                    </div>
                </section>
            )}

            {/* Métricas Financieras */}
            {estadisticas && (
                <section className={estilos.metricasSecundarias}>
                    <div className={estilos.metricaCard}>
                        <div className={`${estilos.metricaIcono} ${estilos.green}`}>
                            <Image 
                                src="/financias/iconosv2/Growth.png" 
                                alt="Cobrado" 
                                width={26} 
                                height={26}
                            />
                        </div>
                        <div className={estilos.metricaDetalle}>
                            <span className={estilos.metricaLabel}>Total Cobrado</span>
                            <span className={estilos.metricaValor}>
                                {formatearMonedaCorta(estadisticas.total_monto_pagado || 0)}
                            </span>
                        </div>
                    </div>

                    <div className={estilos.metricaCard}>
                        <div className={`${estilos.metricaIcono} ${estilos.blue}`}>
                            <Image 
                                src="/financias/iconosv2/Savings Account-Dollar.png" 
                                alt="Por Cobrar" 
                                width={26} 
                                height={26}
                            />
                        </div>
                        <div className={estilos.metricaDetalle}>
                            <span className={estilos.metricaLabel}>Por Cobrar</span>
                            <span className={estilos.metricaValor}>
                                {formatearMonedaCorta((estadisticas.total_monto_cuotas || 0) - (estadisticas.total_monto_pagado || 0))}
                            </span>
                        </div>
                    </div>

                    <div className={estilos.metricaCard}>
                        <div className={`${estilos.metricaIcono} ${estilos.red}`}>
                            <Image 
                                src="/financias/iconosv2/Expense Tracker-Dollar.png" 
                                alt="Mora" 
                                width={26} 
                                height={26}
                            />
                        </div>
                        <div className={estilos.metricaDetalle}>
                            <span className={estilos.metricaLabel}>Mora Acumulada</span>
                            <span className={estilos.metricaValor}>
                                {formatearMonedaCorta(estadisticas.total_mora || 0)}
                            </span>
                        </div>
                    </div>

                    <div className={estilos.metricaCard}>
                        <div className={`${estilos.metricaIcono} ${estilos.orange}`}>
                            <Image 
                                src="/financias/iconosv2/Percentage.png" 
                                alt="Morosidad" 
                                width={26} 
                                height={26}
                            />
                        </div>
                        <div className={estilos.metricaDetalle}>
                            <span className={estilos.metricaLabel}>Tasa Morosidad</span>
                            <span className={estilos.metricaValor}>
                                {estadisticas.total_cuotas > 0 
                                    ? ((estadisticas.cuotas_vencidas_activas / estadisticas.total_cuotas) * 100).toFixed(1)
                                    : 0}%
                            </span>
                        </div>
                    </div>
                </section>
            )}

            {/* Barra de Filtros */}
            <section className={estilos.filtrosSeccion}>
                <div className={estilos.filtrosHeader}>
                    <div className={estilos.busquedaContainer}>
                        <ion-icon name="search-outline"></ion-icon>
                        <input
                            type="text"
                            placeholder="Buscar cliente, contrato..."
                            className={estilos.inputBuscar}
                            name="buscar"
                            value={filtros.buscar}
                            onChange={manejarCambioFiltro}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    cargarDatos()
                                }
                            }}
                        />
                        {filtros.buscar && (
                            <button 
                                className={estilos.limpiarBusqueda}
                                onClick={() => setFiltros(prev => ({ ...prev, buscar: '' }))}
                            >
                                <ion-icon name="close-circle"></ion-icon>
                            </button>
                        )}
                    </div>

                    <div className={estilos.filtrosAcciones}>
                        <button 
                            className={`${estilos.btnFiltros} ${filtrosAbiertos ? estilos.activo : ''}`}
                            onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
                        >
                            <ion-icon name="options-outline"></ion-icon>
                            <span>Filtros</span>
                            {(filtros.estado || filtros.fecha_desde || filtros.fecha_hasta || filtros.vencidas) && (
                                <span className={estilos.filtrosContador}>
                                    {[filtros.estado, filtros.fecha_desde, filtros.fecha_hasta, filtros.vencidas].filter(Boolean).length}
                                </span>
                            )}
                        </button>

                        <div className={estilos.vistaToggle}>
                            <button 
                                className={`${estilos.btnVista} ${vistaActiva === 'tabla' ? estilos.activo : ''}`}
                                onClick={() => setVistaActiva('tabla')}
                                title="Vista tabla"
                            >
                                <ion-icon name="list-outline"></ion-icon>
                            </button>
                            <button 
                                className={`${estilos.btnVista} ${vistaActiva === 'tarjetas' ? estilos.activo : ''}`}
                                onClick={() => setVistaActiva('tarjetas')}
                                title="Vista tarjetas"
                            >
                                <ion-icon name="grid-outline"></ion-icon>
                            </button>
                        </div>
                    </div>
                </div>

                {filtrosAbiertos && (
                    <div className={estilos.filtrosExpandidos}>
                        <div className={estilos.filtroGrupo}>
                            <label className={estilos.filtroLabel}>Estado</label>
                            <select
                                className={estilos.selectFiltro}
                                name="estado"
                                value={filtros.estado}
                                onChange={manejarCambioFiltro}
                            >
                                <option value="">Todos</option>
                                <option value="pendiente">Pendientes</option>
                                <option value="pagada">Pagadas</option>
                                <option value="parcial">Parciales</option>
                                <option value="vencida">Vencidas</option>
                                <option value="condonada">Condonadas</option>
                            </select>
                        </div>

                        <div className={estilos.filtroGrupo}>
                            <label className={estilos.filtroLabel}>Desde</label>
                            <input
                                type="date"
                                className={estilos.inputFecha}
                                name="fecha_desde"
                                value={filtros.fecha_desde}
                                onChange={manejarCambioFiltro}
                            />
                        </div>

                        <div className={estilos.filtroGrupo}>
                            <label className={estilos.filtroLabel}>Hasta</label>
                            <input
                                type="date"
                                className={estilos.inputFecha}
                                name="fecha_hasta"
                                value={filtros.fecha_hasta}
                                onChange={manejarCambioFiltro}
                            />
                        </div>

                        <div className={estilos.filtroGrupo}>
                            <label className={estilos.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    name="vencidas"
                                    checked={filtros.vencidas}
                                    onChange={manejarCambioFiltro}
                                />
                                <span className={estilos.checkboxCustom}></span>
                                Solo vencidas
                            </label>
                        </div>

                        <button className={estilos.btnLimpiar} onClick={limpiarFiltros}>
                            <ion-icon name="refresh-outline"></ion-icon>
                            Limpiar
                        </button>
                    </div>
                )}
            </section>

            {/* Contenido Principal */}
            <div className={estilos.contenidoPrincipal}>
                {/* Sección de Tabla/Tarjetas */}
                {vistaActiva === 'tabla' ? (
                    <section className={estilos.tablaSeccion}>
                        <div className={estilos.tablaHeader}>
                            <div className={estilos.tablaHeaderTitulo}>
                                <ion-icon name="receipt-outline"></ion-icon>
                                <h3>Historial de Cuotas</h3>
                            </div>
                            <div className={estilos.tablaTabs}>
                                <button 
                                    className={`${estilos.tablaTab} ${tabActiva === 'todas' ? estilos.activo : ''}`}
                                    onClick={() => setTabActiva('todas')}
                                >
                                    Todas
                                </button>
                                <button 
                                    className={`${estilos.tablaTab} ${tabActiva === 'pendientes' ? estilos.activo : ''}`}
                                    onClick={() => setTabActiva('pendientes')}
                                >
                                    Pendientes
                                </button>
                                <button 
                                    className={`${estilos.tablaTab} ${tabActiva === 'vencidas' ? estilos.activo : ''}`}
                                    onClick={() => setTabActiva('vencidas')}
                                >
                                    Vencidas
                                </button>
                                <button 
                                    className={`${estilos.tablaTab} ${tabActiva === 'pagadas' ? estilos.activo : ''}`}
                                    onClick={() => setTabActiva('pagadas')}
                                >
                                    Pagadas
                                </button>
                            </div>
                        </div>
                        <div className={estilos.tablaContenedor}>
                            <table className={estilos.tabla}>
                                <thead>
                                    <tr>
                                        <th>Cliente</th>
                                        <th>Contrato</th>
                                        <th className={estilos.centrado}>Cuota</th>
                                        <th>Vencimiento</th>
                                        <th className={estilos.derecha}>Monto</th>
                                        <th className={estilos.derecha}>Pagado</th>
                                        <th className={estilos.derecha}>Mora</th>
                                        <th className={estilos.centrado}>Atraso</th>
                                        <th className={estilos.centrado}>Estado</th>
                                        <th className={estilos.centrado}>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cuotas.length === 0 ? (
                                        <tr>
                                            <td colSpan="10">
                                                <div className={estilos.sinDatos}>
                                                    <ion-icon name="file-tray-outline"></ion-icon>
                                                    <span>No hay cuotas que mostrar</span>
                                                    <p>Ajusta los filtros o crea un nuevo contrato</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        cuotas.map((cuota, index) => {
                                            const diasAtraso = cuota.dias_atraso_calculado || calcularDiasAtraso(cuota.fecha_vencimiento)
                                            const esVencida = diasAtraso > 0 && cuota.estado !== ESTADOS_CUOTA.PAGADA
                                            const estadoInfo = formatearEstadoCuota(cuota.estado)

                                            return (
                                                <tr 
                                                    key={cuota.id}
                                                    className={`${esVencida ? estilos.filaVencida : ''} ${estilos.filaAnimada}`}
                                                    style={{ animationDelay: `${index * 0.03}s` }}
                                                >
                                                    <td>
                                                        <div className={estilos.clienteCell}>
                                                            <div className={estilos.avatarCliente}>
                                                                {cuota.cliente_nombre?.charAt(0) || 'C'}
                                                            </div>
                                                            <div className={estilos.clienteInfo}>
                                                                <span className={estilos.clienteNombre}>
                                                                    {cuota.cliente_nombre}
                                                                </span>
                                                                <span className={estilos.clienteDoc}>
                                                                    {cuota.cliente_documento}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <Link 
                                                            href={`/admin/contratos/ver/${cuota.contrato_id}`}
                                                            className={estilos.contratoLink}
                                                        >
                                                            <span className={estilos.contratoNumero}>
                                                                {cuota.numero_contrato}
                                                            </span>
                                                            <span className={estilos.contratoFecha}>
                                                                {formatearFecha(cuota.fecha_contrato)}
                                                            </span>
                                                        </Link>
                                                    </td>
                                                    <td className={estilos.centrado}>
                                                        <span className={estilos.numeroCuota}>
                                                            #{cuota.numero_cuota}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className={estilos.fechaVencimiento}>
                                                            <span>{formatearFecha(cuota.fecha_vencimiento)}</span>
                                                            {esVencida && (
                                                                <span className={estilos.vencidaBadge}>
                                                                    <ion-icon name="warning"></ion-icon>
                                                                    Vencida
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className={estilos.derecha}>
                                                        <span className={estilos.monto}>
                                                            {formatearMoneda(cuota.monto_cuota)}
                                                        </span>
                                                    </td>
                                                    <td className={estilos.derecha}>
                                                        <span className={`${estilos.monto} ${estilos.montoPagado}`}>
                                                            {formatearMoneda(cuota.monto_pagado)}
                                                        </span>
                                                    </td>
                                                    <td className={estilos.derecha}>
                                                        <span className={`${estilos.monto} ${parseFloat(cuota.monto_mora) > 0 ? estilos.montoMora : ''}`}>
                                                            {formatearMoneda(cuota.monto_mora)}
                                                        </span>
                                                    </td>
                                                    <td className={estilos.centrado}>
                                                        {diasAtraso > 0 && cuota.estado !== ESTADOS_CUOTA.PAGADA ? (
                                                            <span className={estilos.diasAtraso}>
                                                                {diasAtraso}d
                                                            </span>
                                                        ) : (
                                                            <span className={estilos.sinAtraso}>—</span>
                                                        )}
                                                    </td>
                                                    <td className={estilos.centrado}>
                                                        <span className={`${estilos.badge} ${estilos[estadoInfo.color]}`}>
                                                            {estadoInfo.texto}
                                                        </span>
                                                    </td>
                                                    <td className={estilos.centrado}>
                                                        <div className={estilos.acciones}>
                                                            <Link
                                                                href={`/admin/cuotas/ver/${cuota.id}`}
                                                                className={`${estilos.btnAccion} ${estilos.btnAccionPrimario}`}
                                                                title="Ver detalle"
                                                            >
                                                                <ion-icon name="eye-outline"></ion-icon>
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                ) : (
                    <section className={estilos.tarjetasSeccion}>
                        <div className={estilos.tarjetasGrid}>
                            {cuotas.length === 0 ? (
                                <div className={estilos.vacio}>
                                    <ion-icon name="file-tray-outline"></ion-icon>
                                    <h3>No hay cuotas</h3>
                                    <p>Ajusta los filtros o crea un nuevo contrato</p>
                                </div>
                            ) : (
                                cuotas.map((cuota, index) => {
                                    const diasAtraso = cuota.dias_atraso_calculado || calcularDiasAtraso(cuota.fecha_vencimiento)
                                    const montoPendiente = parseFloat(cuota.monto_cuota) + parseFloat(cuota.monto_mora || 0) - parseFloat(cuota.monto_pagado || 0)
                                    const esVencida = diasAtraso > 0 && cuota.estado !== ESTADOS_CUOTA.PAGADA
                                    const estadoInfo = formatearEstadoCuota(cuota.estado)
                                    const porcentajePago = ((parseFloat(cuota.monto_pagado) / parseFloat(cuota.monto_cuota)) * 100).toFixed(0)

                                    return (
                                        <div 
                                            key={cuota.id} 
                                            className={`${estilos.tarjetaCuota} ${esVencida ? estilos.tarjetaVencida : ''}`}
                                            style={{ animationDelay: `${index * 0.05}s` }}
                                        >
                                            <div className={estilos.tarjetaHeader}>
                                                <div className={estilos.tarjetaContrato}>
                                                    <span className={estilos.tarjetaNumero}>Cuota #{cuota.numero_cuota}</span>
                                                    <Link 
                                                        href={`/admin/contratos/ver/${cuota.contrato_id}`}
                                                        className={estilos.tarjetaContratoLink}
                                                    >
                                                        {cuota.numero_contrato}
                                                    </Link>
                                                </div>
                                                <span className={`${estilos.badge} ${estilos[estadoInfo.color]}`}>
                                                    {estadoInfo.texto}
                                                </span>
                                            </div>

                                            <div className={estilos.tarjetaCliente}>
                                                <div className={estilos.avatarCliente}>
                                                    {cuota.cliente_nombre?.charAt(0) || 'C'}
                                                </div>
                                                <div className={estilos.tarjetaClienteInfo}>
                                                    <span className={estilos.tarjetaClienteNombre}>{cuota.cliente_nombre}</span>
                                                    <span className={estilos.tarjetaClienteDoc}>{cuota.cliente_documento}</span>
                                                </div>
                                            </div>

                                            <div className={estilos.tarjetaMontos}>
                                                <div className={estilos.tarjetaMontoItem}>
                                                    <span className={estilos.tarjetaMontoLabel}>Monto Cuota</span>
                                                    <span className={estilos.tarjetaMontoValor}>{formatearMoneda(cuota.monto_cuota)}</span>
                                                </div>
                                                {parseFloat(cuota.monto_mora) > 0 && (
                                                    <div className={estilos.tarjetaMontoItem}>
                                                        <span className={estilos.tarjetaMontoLabel}>Mora</span>
                                                        <span className={`${estilos.tarjetaMontoValor} ${estilos.montoMora}`}>
                                                            {formatearMoneda(cuota.monto_mora)}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className={estilos.tarjetaMontoItem}>
                                                    <span className={estilos.tarjetaMontoLabel}>Pendiente</span>
                                                    <span className={`${estilos.tarjetaMontoValor} ${estilos.montoPendiente}`}>
                                                        {formatearMoneda(montoPendiente)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className={estilos.tarjetaProgreso}>
                                                <div className={estilos.progresoInfo}>
                                                    <span>Pagado</span>
                                                    <span>{porcentajePago}%</span>
                                                </div>
                                                <div className={estilos.barraProgreso}>
                                                    <div 
                                                        className={estilos.barraProgresoFill}
                                                        style={{ width: `${Math.min(porcentajePago, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            <div className={estilos.tarjetaFooter}>
                                                <div className={estilos.tarjetaVencimiento}>
                                                    <ion-icon name="calendar-outline"></ion-icon>
                                                    <span>{formatearFecha(cuota.fecha_vencimiento)}</span>
                                                    {esVencida && (
                                                        <span className={estilos.diasAtrasoSmall}>{diasAtraso}d</span>
                                                    )}
                                                </div>
                                                <div className={estilos.tarjetaAcciones}>
                                                    <Link
                                                        href={`/admin/cuotas/ver/${cuota.id}`}
                                                        className={estilos.btnTarjeta}
                                                    >
                                                        Ver Detalle
                                                        <ion-icon name="arrow-forward-outline"></ion-icon>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </section>
                )}

                {/* Panel Lateral - Próximas Cuotas */}
                <aside className={estilos.panelLateral}>
                    <div className={estilos.panelCard}>
                        <div className={estilos.panelHeader}>
                            <h3 className={estilos.panelTitulo}>Próximos Vencimientos</h3>
                            <Link href="/admin/cuotas" className={estilos.verTodosLink}>
                                Ver todo
                                <ion-icon name="arrow-forward-outline"></ion-icon>
                            </Link>
                        </div>
                        <div className={estilos.listaProximas}>
                            {proximasCuotas.length === 0 ? (
                                <div className={estilos.sinDatos} style={{ padding: '30px' }}>
                                    <ion-icon name="checkmark-circle-outline" style={{ fontSize: '40px', color: 'var(--accent-green)' }}></ion-icon>
                                    <span style={{ fontSize: '14px' }}>Sin cuotas próximas</span>
                                </div>
                            ) : (
                                proximasCuotas.map((cuota) => (
                                    <Link 
                                        key={cuota.id}
                                        href={`/admin/cuotas/ver/${cuota.id}`}
                                        className={estilos.itemProxima}
                                    >
                                        <div className={`${estilos.itemProximaIcono} ${estilos[cuota.tipo]}`}>
                                            <ion-icon name={
                                                cuota.tipo === 'hoy' ? 'alert-circle-outline' :
                                                cuota.tipo === 'manana' ? 'time-outline' : 'calendar-outline'
                                            }></ion-icon>
                                        </div>
                                        <div className={estilos.itemProximaInfo}>
                                            <span className={estilos.itemProximaTitulo}>
                                                {cuota.cliente_nombre}
                                            </span>
                                            <span className={estilos.itemProximaSubtitulo}>
                                                {cuota.numero_contrato} • Cuota #{cuota.numero_cuota}
                                            </span>
                                        </div>
                                        <div className={estilos.itemProximaMonto}>
                                            <span className={`${estilos.itemProximaMontoValor} ${cuota.tipo === 'hoy' ? estilos.negativo : ''}`}>
                                                {formatearMoneda(cuota.monto_cuota)}
                                            </span>
                                            <span className={`${estilos.itemProximaEstado} ${estilos[cuota.estado]}`}>
                                                {cuota.diffDias <= 0 ? 'Vencida' : 
                                                 cuota.diffDias === 1 ? 'Mañana' : 
                                                 `${cuota.diffDias} días`}
                                            </span>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Resumen Rápido */}
                    {estadisticas && (
                        <div className={estilos.panelCard}>
                            <div className={estilos.panelHeader}>
                                <h3 className={estilos.panelTitulo}>Resumen del Mes</h3>
                            </div>
                            <div className={estilos.listaProximas}>
                                <div className={estilos.itemProxima} style={{ cursor: 'default' }}>
                                    <div className={`${estilos.itemProximaIcono} ${estilos.semana}`}>
                                        <Image 
                                            src="/financias/iconosv2/Coin- Dollar.png" 
                                            alt="Recaudado" 
                                            width={24} 
                                            height={24}
                                        />
                                    </div>
                                    <div className={estilos.itemProximaInfo}>
                                        <span className={estilos.itemProximaTitulo}>Recaudado</span>
                                        <span className={estilos.itemProximaSubtitulo}>Este mes</span>
                                    </div>
                                    <div className={estilos.itemProximaMonto}>
                                        <span className={`${estilos.itemProximaMontoValor} ${estilos.positivo}`}>
                                            +{formatearMonedaCorta(estadisticas.total_monto_pagado || 0)}
                                        </span>
                                    </div>
                                </div>
                                <div className={estilos.itemProxima} style={{ cursor: 'default' }}>
                                    <div className={`${estilos.itemProximaIcono} ${estilos.manana}`}>
                                        <Image 
                                            src="/financias/iconosv2/Bill Reminder-Dollar.png" 
                                            alt="Por Cobrar" 
                                            width={24} 
                                            height={24}
                                        />
                                    </div>
                                    <div className={estilos.itemProximaInfo}>
                                        <span className={estilos.itemProximaTitulo}>Por Cobrar</span>
                                        <span className={estilos.itemProximaSubtitulo}>Este mes</span>
                                    </div>
                                    <div className={estilos.itemProximaMonto}>
                                        <span className={estilos.itemProximaMontoValor}>
                                            {formatearMonedaCorta((estadisticas.total_monto_cuotas || 0) - (estadisticas.total_monto_pagado || 0))}
                                        </span>
                                    </div>
                                </div>
                                <div className={estilos.itemProxima} style={{ cursor: 'default' }}>
                                    <div className={`${estilos.itemProximaIcono} ${estilos.hoy}`}>
                                        <Image 
                                            src="/financias/iconosv2/Fraud Alert.png" 
                                            alt="Mora" 
                                            width={24} 
                                            height={24}
                                        />
                                    </div>
                                    <div className={estilos.itemProximaInfo}>
                                        <span className={estilos.itemProximaTitulo}>Mora Total</span>
                                        <span className={estilos.itemProximaSubtitulo}>Acumulada</span>
                                    </div>
                                    <div className={estilos.itemProximaMonto}>
                                        <span className={`${estilos.itemProximaMontoValor} ${estilos.negativo}`}>
                                            -{formatearMonedaCorta(estadisticas.total_mora || 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </aside>
            </div>

            {/* Paginación */}
            {paginacion.totalPaginas > 1 && (
                <section className={estilos.paginacionSeccion}>
                    <div className={estilos.paginacionInfo}>
                        Mostrando {((paginacion.pagina - 1) * paginacion.limite) + 1} - {Math.min(paginacion.pagina * paginacion.limite, paginacion.total)} de {paginacion.total} cuotas
                    </div>
                    <div className={estilos.paginacionControles}>
                        <button
                            className={estilos.btnPaginacion}
                            onClick={() => cambiarPagina(1)}
                            disabled={paginacion.pagina === 1}
                            title="Primera página"
                        >
                            <ion-icon name="play-back-outline"></ion-icon>
                        </button>
                        <button
                            className={estilos.btnPaginacion}
                            onClick={() => cambiarPagina(paginacion.pagina - 1)}
                            disabled={paginacion.pagina === 1}
                        >
                            <ion-icon name="chevron-back-outline"></ion-icon>
                            <span>Anterior</span>
                        </button>
                        
                        <div className={estilos.paginacionNumeros}>
                            {Array.from({ length: Math.min(5, paginacion.totalPaginas) }, (_, i) => {
                                let pagina
                                if (paginacion.totalPaginas <= 5) {
                                    pagina = i + 1
                                } else if (paginacion.pagina <= 3) {
                                    pagina = i + 1
                                } else if (paginacion.pagina >= paginacion.totalPaginas - 2) {
                                    pagina = paginacion.totalPaginas - 4 + i
                                } else {
                                    pagina = paginacion.pagina - 2 + i
                                }
                                return (
                                    <button
                                        key={pagina}
                                        className={`${estilos.btnPaginaNumero} ${paginacion.pagina === pagina ? estilos.activo : ''}`}
                                        onClick={() => cambiarPagina(pagina)}
                                    >
                                        {pagina}
                                    </button>
                                )
                            })}
                        </div>

                        <button
                            className={estilos.btnPaginacion}
                            onClick={() => cambiarPagina(paginacion.pagina + 1)}
                            disabled={paginacion.pagina === paginacion.totalPaginas}
                        >
                            <span>Siguiente</span>
                            <ion-icon name="chevron-forward-outline"></ion-icon>
                        </button>
                        <button
                            className={estilos.btnPaginacion}
                            onClick={() => cambiarPagina(paginacion.totalPaginas)}
                            disabled={paginacion.pagina === paginacion.totalPaginas}
                            title="Última página"
                        >
                            <ion-icon name="play-forward-outline"></ion-icon>
                        </button>
                    </div>
                </section>
            )}
        </div>
    )
}
