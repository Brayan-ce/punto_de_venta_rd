"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { obtenerDashboardContratos } from './servidor'
import { 
    PieChart, Pie, Cell, ResponsiveContainer, 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    AreaChart, Area
} from 'recharts'
import estilos from './contratos.module.css'

export default function ContratosFinanciamiento() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [isMobile, setIsMobile] = useState(false)
    const [estadisticas, setEstadisticas] = useState({
        total_contratos: 0,
        contratos_activos: 0,
        contratos_pagados: 0,
        contratos_incumplidos: 0,
        total_financiado: 0,
        total_por_cobrar: 0,
        total_cobrado: 0,
        total_intereses: 0,
        promedio_financiado: 0,
        cuotas_pendientes: 0,
        cuotas_vencidas: 0,
        total_mora: 0,
        cuotas_proximas: 0
    })
    const [contratosRecientes, setContratosRecientes] = useState([])
    const [distribucionEstados, setDistribucionEstados] = useState([])
    const [evolucionMensual, setEvolucionMensual] = useState([])
    const [alertas, setAlertas] = useState([])
    const [topClientes, setTopClientes] = useState([])

    useEffect(() => {
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)

        const manejarCambioTema = () => {
            const nuevoTema = localStorage.getItem('tema') || 'light'
            setTema(nuevoTema)
        }

        // Detectar tamaño de pantalla
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768)
        }
        
        checkMobile()
        window.addEventListener('resize', checkMobile)
        window.addEventListener('temaChange', manejarCambioTema)
        window.addEventListener('storage', manejarCambioTema)

        return () => {
            window.removeEventListener('resize', checkMobile)
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
            const resultado = await obtenerDashboardContratos()
            if (resultado.success) {
                setEstadisticas(resultado.estadisticas || {})
                setContratosRecientes(resultado.contratosRecientes || [])
                setDistribucionEstados(resultado.distribucionEstados || [])
                setEvolucionMensual(resultado.evolucionMensual || [])
                setAlertas(resultado.alertas || [])
                setTopClientes(resultado.topClientes || [])
            } else {
                console.error(resultado.mensaje || 'Error al cargar dashboard')
            }
        } catch (error) {
            console.error('Error al cargar dashboard:', error)
        } finally {
            setCargando(false)
        }
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(monto || 0)
    }

    const formatearNumero = (numero) => {
        return new Intl.NumberFormat('es-DO').format(numero || 0)
    }

    const calcularPorcentaje = (valor, total) => {
        if (!total || total === 0) return 0
        return ((valor / total) * 100).toFixed(1)
    }

    // Colores para gráficas
    const COLORES_TEMA = {
        light: {
            texto: '#0f172a',
            textoSecundario: '#64748b',
            fondo: '#ffffff',
            borde: '#e2e8f0',
            grid: '#f1f5f9'
        },
        dark: {
            texto: '#f1f5f9',
            textoSecundario: '#94a3b8',
            fondo: '#1e293b',
            borde: '#334155',
            grid: '#0f172a'
        }
    }

    const coloresActuales = COLORES_TEMA[tema]

    // Tooltip personalizado para gráficas
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: coloresActuales.fondo,
                    border: `1px solid ${coloresActuales.borde}`,
                    borderRadius: '8px',
                    padding: '12px 16px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                    <p style={{ 
                        margin: '0 0 8px 0', 
                        fontWeight: 700,
                        color: coloresActuales.texto 
                    }}>{label}</p>
                    {payload.map((entry, index) => {
                        const nombreDisplay = typeof entry.name === 'string' ? entry.name : (entry.dataKey || `Serie ${index}`)
                        const esMoneda = typeof nombreDisplay === 'string' && (nombreDisplay.includes('Monto') || nombreDisplay.includes('Pagos'))
                        return (
                            <p key={index} style={{ 
                                margin: '4px 0', 
                                color: entry.color,
                                fontSize: '13px'
                            }}>
                                {nombreDisplay}: {esMoneda
                                    ? formatearMoneda(entry.value) 
                                    : formatearNumero(entry.value)}
                            </p>
                        )
                    })}
                </div>
            )
        }
        return null
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <div className={estilos.cargandoSpinner}></div>
                    <span>Cargando dashboard de contratos...</span>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* Header */}
            <div className={estilos.header}>
                <div className={estilos.headerInfo}>
                    <div className={estilos.headerIcono}>
                        <Image 
                            src="/financias/credit-card.svg" 
                            alt="Contratos" 
                            width={40} 
                            height={40}
                        />
                    </div>
                <div>
                        <h1 className={estilos.titulo}>Dashboard de Contratos</h1>
                        <p className={estilos.subtitulo}>
                            Gestión integral de financiamientos y cobranzas
                        </p>
                    </div>
                </div>
                <div className={estilos.headerAcciones}>
                    <Link href="/admin/contratos/nuevo" className={estilos.btnNuevo}>
                        <ion-icon name="add-circle-outline"></ion-icon>
                        <span>Nuevo Contrato</span>
                    </Link>
                <Link href="/admin/financiamiento" className={estilos.btnSecundario}>
                        <ion-icon name="grid-outline"></ion-icon>
                        <span>Financiamiento</span>
                </Link>
                </div>
            </div>

            {/* Tarjetas de estadísticas principales */}
            <div className={estilos.estadisticas}>
                <div className={`${estilos.estadCard} ${estilos.primary}`}>
                    <div className={estilos.estadIconoWrapper}>
                        <div className={`${estilos.estadIcono} ${estilos.primary}`}>
                            <Image 
                                src="/financias/bank-statement.svg" 
                                alt="Total" 
                                width={36} 
                                height={36}
                            />
                        </div>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Total Financiado</span>
                        <span className={estilos.estadValor}>
                            {formatearMoneda(estadisticas.total_financiado)}
                        </span>
                        <span className={`${estilos.estadTendencia} ${estilos.neutro}`}>
                            <ion-icon name="document-text-outline"></ion-icon>
                            {estadisticas.total_contratos} contratos
                        </span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos.success}`}>
                    <div className={estilos.estadIconoWrapper}>
                        <div className={`${estilos.estadIcono} ${estilos.success}`}>
                            <Image 
                                src="/financias/money-bag.svg" 
                                alt="Cobrado" 
                                width={36} 
                                height={36}
                            />
                        </div>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Total Cobrado</span>
                        <span className={estilos.estadValor}>
                            {formatearMoneda(estadisticas.total_cobrado)}
                        </span>
                        <span className={`${estilos.estadTendencia} ${estilos.positivo}`}>
                            <ion-icon name="trending-up-outline"></ion-icon>
                            {calcularPorcentaje(estadisticas.total_cobrado, estadisticas.total_financiado)}% recuperado
                        </span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos.warning}`}>
                    <div className={estilos.estadIconoWrapper}>
                        <div className={`${estilos.estadIcono} ${estilos.warning}`}>
                            <Image 
                                src="/financias/bill-receipt.svg" 
                                alt="Por Cobrar" 
                                width={36} 
                                height={36}
                            />
                        </div>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Por Cobrar</span>
                        <span className={estilos.estadValor}>
                            {formatearMoneda(estadisticas.total_por_cobrar)}
                        </span>
                        <span className={`${estilos.estadTendencia} ${estilos.neutro}`}>
                            <ion-icon name="calendar-outline"></ion-icon>
                            {estadisticas.cuotas_pendientes} cuotas pendientes
                        </span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos.danger}`}>
                    <div className={estilos.estadIconoWrapper}>
                        <div className={`${estilos.estadIcono} ${estilos.danger}`}>
                            <ion-icon name="alert-circle-outline"></ion-icon>
                        </div>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Mora Acumulada</span>
                        <span className={estilos.estadValor}>
                            {formatearMoneda(estadisticas.total_mora)}
                        </span>
                        <span className={`${estilos.estadTendencia} ${estilos.negativo}`}>
                            <ion-icon name="warning-outline"></ion-icon>
                            {estadisticas.cuotas_vencidas} cuotas vencidas
                        </span>
                    </div>
                </div>
            </div>

            {/* Métricas secundarias */}
            <div className={estilos.metricasSecundarias}>
                <div className={estilos.metricaCard}>
                    <div className={`${estilos.metricaIcono} ${estilos.green}`}>
                        <Image 
                            src="/financias/transaction 1.svg" 
                            alt="Activos" 
                            width={28} 
                            height={28}
                        />
                    </div>
                    <div className={estilos.metricaDetalle}>
                        <span className={estilos.metricaLabel}>Contratos Activos</span>
                        <span className={estilos.metricaValor}>{estadisticas.contratos_activos}</span>
                    </div>
                </div>

                <div className={estilos.metricaCard}>
                    <div className={`${estilos.metricaIcono} ${estilos.blue}`}>
                        <Image 
                            src="/financias/credit-card-visa.svg" 
                            alt="Pagados" 
                            width={28} 
                            height={28}
                        />
                    </div>
                    <div className={estilos.metricaDetalle}>
                        <span className={estilos.metricaLabel}>Contratos Pagados</span>
                        <span className={estilos.metricaValor}>{estadisticas.contratos_pagados}</span>
                    </div>
                </div>

                <div className={estilos.metricaCard}>
                    <div className={`${estilos.metricaIcono} ${estilos.orange}`}>
                        <Image 
                            src="/financias/coins.svg" 
                            alt="Intereses" 
                            width={28} 
                            height={28}
                        />
                    </div>
                    <div className={estilos.metricaDetalle}>
                        <span className={estilos.metricaLabel}>Total Intereses</span>
                        <span className={estilos.metricaValor}>{formatearMoneda(estadisticas.total_intereses)}</span>
                    </div>
                </div>

                <div className={estilos.metricaCard}>
                    <div className={`${estilos.metricaIcono} ${estilos.blue}`}>
                        <Image 
                            src="/financias/wallet 2.svg" 
                            alt="Promedio" 
                            width={28} 
                            height={28}
                        />
                    </div>
                    <div className={estilos.metricaDetalle}>
                        <span className={estilos.metricaLabel}>Promedio Financiado</span>
                        <span className={estilos.metricaValor}>{formatearMoneda(estadisticas.promedio_financiado)}</span>
                    </div>
                </div>
            </div>

            {/* Alertas */}
            {alertas.length > 0 && (
                <div className={estilos.seccionAlertas}>
                    <h2 className={estilos.seccionTitulo}>
                        <ion-icon name="notifications-outline"></ion-icon>
                        <span>Alertas y Notificaciones</span>
                    </h2>
                    <div className={estilos.gridAlertas}>
                        {alertas.map((alerta, index) => (
                            <Link 
                                key={index} 
                                href={alerta.enlace}
                                className={`${estilos.alertaCard} ${estilos[alerta.tipo]}`}
                            >
                                <div className={estilos.alertaIcono}>
                                    <ion-icon name={alerta.icono}></ion-icon>
                                </div>
                                <div className={estilos.alertaInfo}>
                                    <span className={estilos.alertaTitulo}>{alerta.titulo}</span>
                                    <span className={estilos.alertaMensaje}>{alerta.mensaje}</span>
                                </div>
                                <ion-icon name="chevron-forward-outline" className={estilos.alertaFlecha}></ion-icon>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <hr className={estilos.separador} />

            {/* Grid principal: Distribución + Contratos recientes */}
            <div className={estilos.gridPrincipal}>
                {/* Gráfica de distribución */}
                <div className={`${estilos.cardGrafica} ${estilos[tema]}`}>
                    <div className={estilos.cardGraficaHeader}>
                        <div>
                            <h3 className={estilos.cardGraficaTitulo}>
                                <ion-icon name="pie-chart-outline"></ion-icon>
                                Distribución por Estado
                            </h3>
                            <p className={estilos.cardGraficaSubtitulo}>
                                Estado actual de todos los contratos
                            </p>
                        </div>
                    </div>

                    <div className={estilos.graficaCircular}>
                        <div className={estilos.donaContainer}>
                            <ResponsiveContainer width="100%" height={isMobile ? 180 : 200}>
                                <PieChart>
                                    <Pie
                                        data={distribucionEstados.filter(d => d.valor > 0)}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={isMobile ? 50 : 55}
                                        outerRadius={isMobile ? 75 : 85}
                                        paddingAngle={3}
                                        dataKey="valor"
                                        animationBegin={0}
                                        animationDuration={800}
                                    >
                                        {distribucionEstados.filter(d => d.valor > 0).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className={estilos.donaCenter}>
                                <span className={estilos.donaCenterValor}>
                                    {estadisticas.total_contratos}
                                </span>
                                <span className={estilos.donaCenterLabel}>Total</span>
                            </div>
                        </div>

                        <div className={estilos.leyendaCircular}>
                            {distribucionEstados.map((estado, index) => (
                                <div key={index} className={estilos.leyendaItem}>
                                    <div 
                                        className={estilos.leyendaDot}
                                        style={{ backgroundColor: estado.color }}
                                    ></div>
                                    <div className={estilos.leyendaInfo}>
                                        <span className={estilos.leyendaLabel}>{estado.nombre}</span>
                                        <span className={estilos.leyendaValor}>{estado.valor}</span>
                                    </div>
                                    <span className={estilos.leyendaPorcentaje}>
                                        {calcularPorcentaje(estado.valor, estadisticas.total_contratos)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Contratos recientes */}
                <div className={`${estilos.cardContratos} ${estilos[tema]}`}>
                    <div className={estilos.cardContratosHeader}>
                        <h3 className={estilos.cardContratosTitulo}>
                            <ion-icon name="time-outline"></ion-icon>
                            Contratos Recientes
                        </h3>
                        <Link href="/admin/contratos/listar" className={estilos.verTodosLink}>
                            Ver todos
                            <ion-icon name="arrow-forward-outline"></ion-icon>
                        </Link>
                    </div>

                    {contratosRecientes.length === 0 ? (
                        <div className={estilos.contratosVacio}>
                            <ion-icon name="document-outline"></ion-icon>
                            <span>No hay contratos registrados</span>
                        </div>
                    ) : (
                        <div className={estilos.listaContratos}>
                            {contratosRecientes.slice(0, 5).map((contrato) => {
                                const nombreCompleto = `${contrato.cliente_nombre} ${contrato.cliente_apellidos || ''}`.trim()
                                const iniciales = contrato.cliente_nombre?.charAt(0) || 'C'
                                const equipoInfo = contrato.equipos_activos || 'Sin equipo asignado'
                                
                                return (
                                    <Link
                                        key={contrato.id}
                                        href={`/admin/contratos/ver/${contrato.id}`}
                                        className={estilos.itemContrato}
                                    >
                                        <div className={estilos.contratoAvatar}>
                                            {contrato.cliente_foto ? (
                                                <img 
                                                    src={contrato.cliente_foto} 
                                                    alt={nombreCompleto}
                                                />
                                            ) : (
                                                <span>{iniciales}</span>
                                            )}
                                        </div>
                                        <div className={estilos.contratoInfo}>
                                            <span className={estilos.contratoNumero}>
                                                {nombreCompleto}
                                            </span>
                                            <span className={estilos.contratoCliente}>
                                                {equipoInfo}
                                            </span>
                                        </div>
                                        <div className={estilos.contratoMonto}>
                                            <span className={estilos.contratoMontoValor}>
                                                {formatearMoneda(contrato.saldo_pendiente)}
                                            </span>
                                            <span className={estilos.contratoMontoLabel}>pendiente</span>
                                        </div>
                                        <span className={`${estilos.contratoEstado} ${estilos[contrato.estado]}`}>
                                            {contrato.estado}
                                        </span>
                                    </Link>
                                )
                            })}
                        </div>
                        )}
                </div>
            </div>

            {/* Gráfica de evolución mensual */}
            {evolucionMensual.length > 0 && (
                <div className={estilos.seccionEvolucion}>
                    <div className={`${estilos.cardEvolucion} ${estilos[tema]}`}>
                        <div className={estilos.cardGraficaHeader}>
                            <div>
                                <h3 className={estilos.cardGraficaTitulo}>
                                    <ion-icon name="bar-chart-outline"></ion-icon>
                                    Evolución Mensual
                                </h3>
                                <p className={estilos.cardGraficaSubtitulo}>
                                    Contratos y pagos de los últimos 6 meses
                                </p>
                            </div>
                        </div>

                        <div className={estilos.graficaBarras}>
                            <ResponsiveContainer width="100%" height={isMobile ? 280 : 300}>
                                <BarChart
                                    data={evolucionMensual}
                                    margin={isMobile 
                                        ? { top: 10, right: 5, left: -15, bottom: 5 }
                                        : { top: 20, right: 30, left: 0, bottom: 5 }
                                    }
                                >
                                    <CartesianGrid 
                                        strokeDasharray="3 3" 
                                        stroke={coloresActuales.grid}
                                        vertical={false}
                                    />
                                    <XAxis 
                                        dataKey="mes_nombre" 
                                        tick={{ fill: coloresActuales.textoSecundario, fontSize: isMobile ? 10 : 12 }}
                                        axisLine={{ stroke: coloresActuales.borde }}
                                        tickMargin={5}
                                    />
                                    <YAxis 
                                        yAxisId="left"
                                        tick={{ fill: coloresActuales.textoSecundario, fontSize: isMobile ? 9 : 11 }}
                                        axisLine={{ stroke: coloresActuales.borde }}
                                        tickFormatter={(value) => value}
                                        width={isMobile ? 30 : 40}
                                    />
                                    <YAxis 
                                        yAxisId="right"
                                        orientation="right"
                                        tick={{ fill: coloresActuales.textoSecundario, fontSize: isMobile ? 9 : 11 }}
                                        axisLine={{ stroke: coloresActuales.borde }}
                                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                                        width={isMobile ? 35 : 50}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend 
                                        wrapperStyle={{ 
                                            paddingTop: isMobile ? '10px' : '16px',
                                            fontSize: isMobile ? '11px' : '13px',
                                            color: coloresActuales.texto
                                        }}
                                        iconSize={isMobile ? 8 : 12}
                                    />
                                    <Bar 
                                        yAxisId="left"
                                        dataKey="contratos" 
                                        name="Contratos" 
                                        fill="#3b82f6"
                                        radius={[4, 4, 0, 0]}
                                        animationDuration={800}
                                    />
                                    <Bar 
                                        yAxisId="right"
                                        dataKey="monto_financiado" 
                                        name={isMobile ? "Monto" : "Monto Financiado"}
                                        fill="#10b981"
                                        radius={[4, 4, 0, 0]}
                                        animationDuration={800}
                                        animationBegin={200}
                                    />
                                    <Bar 
                                        yAxisId="right"
                                        dataKey="pagos_recibidos" 
                                        name={isMobile ? "Pagos" : "Pagos Recibidos"}
                                        fill="#f59e0b"
                                        radius={[4, 4, 0, 0]}
                                        animationDuration={800}
                                        animationBegin={400}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Top clientes */}
            {topClientes.length > 0 && (
                <div className={estilos.seccionClientes}>
                    <h2 className={estilos.seccionTitulo}>
                        <ion-icon name="people-outline"></ion-icon>
                        <span>Top Clientes por Financiamiento</span>
                    </h2>
                    <div className={estilos.gridClientes}>
                        {topClientes.map((cliente, index) => (
                            <div key={cliente.id} className={estilos.clienteCard}>
                                <div className={`${estilos.clienteRango} ${
                                    index === 0 ? estilos.oro : 
                                    index === 1 ? estilos.plata : 
                                    index === 2 ? estilos.bronce : ''
                                }`}>
                                    {index + 1}
                                </div>
                                <div className={estilos.clienteInfo}>
                                    <span className={estilos.clienteNombre}>{cliente.nombre}</span>
                                    <span className={estilos.clienteContratos}>
                                        {cliente.total_contratos} contrato{cliente.total_contratos !== 1 ? 's' : ''} activo{cliente.total_contratos !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className={estilos.clienteMonto}>
                                    <span className={estilos.clienteMontoValor}>
                                        {formatearMoneda(cliente.total_financiado)}
                    </span>
                                    <span className={estilos.clienteMontoLabel}>financiado</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Estado vacío */}
            {estadisticas.total_contratos === 0 && (
                <div className={`${estilos.vacio} ${estilos[tema]}`}>
                    <div className={estilos.vacioIcono}>
                        <Image 
                            src="/financias/credit-card.svg" 
                            alt="Sin contratos" 
                            width={100} 
                            height={100}
                        />
                    </div>
                    <h3 className={estilos.vacioTitulo}>No hay contratos registrados</h3>
                    <p className={estilos.vacioTexto}>
                        Comienza creando tu primer contrato de financiamiento para gestionar
                        las cuotas y pagos de tus clientes.
                    </p>
                    <Link href="/admin/contratos/nuevo" className={estilos.btnNuevo}>
                        <ion-icon name="add-circle-outline"></ion-icon>
                        <span>Crear Primer Contrato</span>
                    </Link>
                </div>
            )}
        </div>
    )
}
