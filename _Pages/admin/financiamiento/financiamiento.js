"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { obtenerDashboardFinanciamiento } from './servidor'
import { obtenerContratos } from '../contratos/servidor'
import { obtenerAlertas } from '../alertas/servidor'
import { obtenerPlanesFinanciamiento } from '../planes/servidor'
import estilos from './financiamiento.module.css'

// Lucide Icons
import {
    CreditCard,
    FileText,
    Calendar,
    DollarSign,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    AlertCircle,
    Bell,
    Phone,
    MessageCircle,
    Eye,
    ArrowRight,
    Wallet,
    PiggyBank,
    Receipt,
    BarChart3,
    PieChart,
    CircleDollarSign,
    Banknote,
    Clock,
    CheckCircle,
    XCircle,
    RefreshCw,
    Search,
    Filter,
    Plus,
    ChevronRight,
    Loader2,
    Building2,
    Users,
    Target,
    Sparkles,
    Landmark,
    ShieldCheck,
    BadgePercent,
    CalendarClock,
    HandCoins
} from 'lucide-react'

export default function FinanciamientoAdmin() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [metricas, setMetricas] = useState(null)
    const [contratos, setContratos] = useState([])
    const [alertas, setAlertas] = useState([])
    const [planes, setPlanes] = useState([])
    const [filtroEstado, setFiltroEstado] = useState('')
    const [buscar, setBuscar] = useState('')

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
    }, [filtroEstado, buscar])

    const cargarDatos = async () => {
        setCargando(true)
        try {
            const [resultadoMetricas, resultadoContratos, resultadoAlertas, resultadoPlanes] = await Promise.all([
                obtenerDashboardFinanciamiento(),
                obtenerContratos({ estado: filtroEstado || undefined, buscar: buscar || undefined }),
                obtenerAlertas({ estado: 'activa', severidad: 'critica' }),
                obtenerPlanesFinanciamiento({ activo: true })
            ])

            if (resultadoMetricas.success) {
                setMetricas(resultadoMetricas.metricas)
            }

            if (resultadoContratos.success) {
                setContratos(resultadoContratos.contratos)
            }

            if (resultadoAlertas.success) {
                setAlertas(resultadoAlertas.alertas.slice(0, 5))
            }

            if (resultadoPlanes.success) {
                setPlanes(resultadoPlanes.planes.slice(0, 4))
            }
        } catch (error) {
            console.error('Error al cargar datos:', error)
        } finally {
            setCargando(false)
        }
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(monto || 0)
    }

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-DO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
    }

    const obtenerColorEstado = (estado) => {
        const colores = {
            activo: 'success',
            pagado: 'info',
            incumplido: 'danger',
            reestructurado: 'warning',
            cancelado: 'secondary'
        }
        return colores[estado] || 'secondary'
    }

    // Calcular distribución de contratos por estado
    const calcularDistribucion = () => {
        if (!contratos.length) return { activos: 0, pagados: 0, vencidos: 0, otros: 0 }
        
        const activos = contratos.filter(c => c.estado === 'activo').length
        const pagados = contratos.filter(c => c.estado === 'pagado').length
        const vencidos = contratos.filter(c => c.estado === 'incumplido').length
        const otros = contratos.length - activos - pagados - vencidos
        
        return { activos, pagados, vencidos, otros }
    }

    const distribucion = calcularDistribucion()
    const totalContratos = contratos.length || 1

    // Módulos de acceso rápido
    const modulosRapidos = [
        { 
            id: 'planes', 
            nombre: 'Planes', 
            descripcion: 'Gestionar planes de financiamiento',
            icono: FileText, 
            href: '/admin/planes',
            color: 'blue',
            ilustracion: '/financias/credit-card.svg'
        },
        { 
            id: 'contratos', 
            nombre: 'Contratos', 
            descripcion: 'Ver y crear contratos',
            icono: Receipt, 
            href: '/admin/contratos',
            color: 'purple',
            ilustracion: '/financias/bill-receipt.svg'
        },
        { 
            id: 'cuotas', 
            nombre: 'Cuotas', 
            descripcion: 'Control de pagos mensuales',
            icono: Calendar, 
            href: '/admin/cuotas',
            color: 'green',
            ilustracion: '/financias/wallet 1.svg'
        },
        { 
            id: 'pagos', 
            nombre: 'Pagos', 
            descripcion: 'Historial de transacciones',
            icono: Banknote, 
            href: '/admin/pagos',
            color: 'orange',
            ilustracion: '/financias/pos-machine.svg'
        },
        { 
            id: 'alertas', 
            nombre: 'Alertas', 
            descripcion: 'Notificaciones y cobranza',
            icono: Bell, 
            href: '/admin/alertas',
            color: 'red',
            ilustracion: '/financias/bank-statement.svg'
        },
        { 
            id: 'activos', 
            nombre: 'Activos', 
            descripcion: 'Equipos financiados',
            icono: Building2, 
            href: '/admin/activos',
            color: 'cyan',
            ilustracion: '/financias/money-bag.svg'
        }
    ]

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <Loader2 className={estilos.iconoCargando} size={64} />
                    <span>Cargando dashboard de financiamiento...</span>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* ============ HERO HEADER ============ */}
            <div className={estilos.heroHeader}>
                <div className={estilos.heroContent}>
                    <div className={estilos.heroTexto}>
                        <div className={estilos.heroBadge}>
                            <Sparkles size={16} />
                            <span>Centro de Financiamiento</span>
                        </div>
                        <h1 className={estilos.heroTitulo}>Dashboard Financiero</h1>
                        <p className={estilos.heroSubtitulo}>
                            Gestión integral de créditos, cobranzas y análisis financiero en tiempo real
                        </p>
                    </div>
                    <div className={estilos.heroAcciones}>
                        <Link href="/admin/contratos/nuevo" className={estilos.btnPrimario}>
                            <Plus size={20} />
                            <span>Nuevo Contrato</span>
                        </Link>
                        <Link href="/admin/planes/nuevo" className={estilos.btnSecundario}>
                            <FileText size={20} />
                            <span>Nuevo Plan</span>
                        </Link>
                    </div>
                </div>
                <div className={estilos.heroIlustracion}>
                    <Image 
                        src="/financias/credit-card.svg" 
                        alt="Financiamiento" 
                        width={280} 
                        height={200}
                        className={estilos.heroImagen}
                    />
                </div>
            </div>

            {/* ============ TARJETAS DE ESTADÍSTICAS ============ */}
            {metricas && (
                <div className={estilos.estadisticasGrid}>
                    <div className={`${estilos.estadCard} ${estilos.contratos}`}>
                        <div className={estilos.estadIconoWrapper}>
                            <div className={estilos.estadIcono}>
                                <FileText size={32} />
                            </div>
                            <Image 
                                src="/financias/bill-receipt.svg" 
                                alt="" 
                                width={80} 
                                height={80}
                                className={estilos.estadIlustracion}
                            />
                        </div>
                        <div className={estilos.estadInfo}>
                            <span className={estilos.estadLabel}>Contratos Activos</span>
                            <span className={estilos.estadValor}>{metricas.contratosActivos}</span>
                            <div className={estilos.estadTendencia}>
                                <TrendingUp size={14} />
                                <span>En proceso</span>
                            </div>
                        </div>
                    </div>

                    <div className={`${estilos.estadCard} ${estilos.vencidas}`}>
                        <div className={estilos.estadIconoWrapper}>
                            <div className={estilos.estadIcono}>
                                <AlertTriangle size={32} />
                            </div>
                            <Image 
                                src="/financias/bank-statement.svg" 
                                alt="" 
                                width={80} 
                                height={80}
                                className={estilos.estadIlustracion}
                            />
                        </div>
                        <div className={estilos.estadInfo}>
                            <span className={estilos.estadLabel}>Cuotas Vencidas</span>
                            <span className={estilos.estadValor}>{metricas.cuotasVencidas}</span>
                            <div className={`${estilos.estadTendencia} ${estilos.alerta}`}>
                                <AlertCircle size={14} />
                                <span>Requieren atención</span>
                            </div>
                        </div>
                    </div>

                    <div className={`${estilos.estadCard} ${estilos.saldo}`}>
                        <div className={estilos.estadIconoWrapper}>
                            <div className={estilos.estadIcono}>
                                <Wallet size={32} />
                            </div>
                            <Image 
                                src="/financias/money-bag.svg" 
                                alt="" 
                                width={80} 
                                height={80}
                                className={estilos.estadIlustracion}
                            />
                        </div>
                        <div className={estilos.estadInfo}>
                            <span className={estilos.estadLabel}>Saldo Pendiente</span>
                            <span className={estilos.estadValor}>{formatearMoneda(metricas.saldoPendiente)}</span>
                            <div className={estilos.estadTendencia}>
                                <CircleDollarSign size={14} />
                                <span>Por cobrar</span>
                            </div>
                        </div>
                    </div>

                    <div className={`${estilos.estadCard} ${estilos.cobrado}`}>
                        <div className={estilos.estadIconoWrapper}>
                            <div className={estilos.estadIcono}>
                                <TrendingUp size={32} />
                            </div>
                            <Image 
                                src="/financias/coins.svg" 
                                alt="" 
                                width={80} 
                                height={80}
                                className={estilos.estadIlustracion}
                            />
                        </div>
                        <div className={estilos.estadInfo}>
                            <span className={estilos.estadLabel}>Cobrado Este Mes</span>
                            <span className={estilos.estadValor}>{formatearMoneda(metricas.cobradoMes)}</span>
                            <div className={`${estilos.estadTendencia} ${estilos.positivo}`}>
                                <CheckCircle size={14} />
                                <span>Total recaudado</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ============ MÓDULOS DE ACCESO RÁPIDO ============ */}
            <section className={estilos.seccionModulos}>
                <div className={estilos.seccionHeader}>
                    <div className={estilos.seccionTitulo}>
                        <Target size={24} />
                        <h2>Acceso Rápido</h2>
                    </div>
                    <p className={estilos.seccionDescripcion}>Navega a los módulos del sistema de financiamiento</p>
                </div>

                <div className={estilos.modulosGrid}>
                    {modulosRapidos.map((modulo) => {
                        const IconoModulo = modulo.icono
                        return (
                            <Link 
                                key={modulo.id}
                                href={modulo.href}
                                className={`${estilos.moduloCard} ${estilos[modulo.color]}`}
                            >
                                <div className={estilos.moduloIcono}>
                                    <IconoModulo size={28} />
                                </div>
                                <div className={estilos.moduloInfo}>
                                    <h3 className={estilos.moduloNombre}>{modulo.nombre}</h3>
                                    <p className={estilos.moduloDescripcion}>{modulo.descripcion}</p>
                                </div>
                                <Image 
                                    src={modulo.ilustracion} 
                                    alt="" 
                                    width={60} 
                                    height={60}
                                    className={estilos.moduloIlustracion}
                                />
                                <ChevronRight size={20} className={estilos.moduloFlecha} />
                            </Link>
                        )
                    })}
                </div>
            </section>

            {/* ============ GRID PRINCIPAL ============ */}
            <div className={estilos.gridPrincipal}>
                {/* Gráfica de distribución */}
                <div className={`${estilos.cardGrafica} ${estilos[tema]}`}>
                    <div className={estilos.cardGraficaHeader}>
                        <div>
                            <h3 className={estilos.cardGraficaTitulo}>
                                <PieChart size={22} />
                                Distribución de Contratos
                            </h3>
                            <p className={estilos.cardGraficaSubtitulo}>Estado actual de todos los contratos</p>
                        </div>
                    </div>

                    <div className={estilos.graficaCircular}>
                        <svg className={estilos.donaChart} viewBox="0 0 200 200">
                            <circle
                                cx="100"
                                cy="100"
                                r="80"
                                fill="none"
                                stroke={tema === 'light' ? '#f1f5f9' : '#1e293b'}
                                strokeWidth="40"
                            />
                            {/* Activos - Verde */}
                            <circle
                                cx="100"
                                cy="100"
                                r="80"
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="40"
                                strokeDasharray={`${((distribucion.activos / totalContratos) * 502.4).toFixed(2)} 502.4`}
                                strokeDashoffset="0"
                                className={estilos.donaSegmento}
                            />
                            {/* Pagados - Azul */}
                            <circle
                                cx="100"
                                cy="100"
                                r="80"
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="40"
                                strokeDasharray={`${((distribucion.pagados / totalContratos) * 502.4).toFixed(2)} 502.4`}
                                strokeDashoffset={`-${((distribucion.activos / totalContratos) * 502.4).toFixed(2)}`}
                                className={estilos.donaSegmento}
                            />
                            {/* Vencidos - Rojo */}
                            <circle
                                cx="100"
                                cy="100"
                                r="80"
                                fill="none"
                                stroke="#ef4444"
                                strokeWidth="40"
                                strokeDasharray={`${((distribucion.vencidos / totalContratos) * 502.4).toFixed(2)} 502.4`}
                                strokeDashoffset={`-${(((distribucion.activos + distribucion.pagados) / totalContratos) * 502.4).toFixed(2)}`}
                                className={estilos.donaSegmento}
                            />
                            {/* Otros - Gris */}
                            <circle
                                cx="100"
                                cy="100"
                                r="80"
                                fill="none"
                                stroke="#94a3b8"
                                strokeWidth="40"
                                strokeDasharray={`${((distribucion.otros / totalContratos) * 502.4).toFixed(2)} 502.4`}
                                strokeDashoffset={`-${(((distribucion.activos + distribucion.pagados + distribucion.vencidos) / totalContratos) * 502.4).toFixed(2)}`}
                                className={estilos.donaSegmento}
                            />
                            <text x="100" y="95" textAnchor="middle" className={estilos.donaTextoValor}>
                                {contratos.length}
                            </text>
                            <text x="100" y="115" textAnchor="middle" className={estilos.donaTextoLabel}>
                                Contratos
                            </text>
                        </svg>

                        <div className={estilos.leyendaCircular}>
                            <div className={estilos.leyendaItem}>
                                <div className={`${estilos.leyendaDot} ${estilos.activos}`}></div>
                                <div className={estilos.leyendaInfo}>
                                    <span className={estilos.leyendaLabel}>Activos</span>
                                    <span className={estilos.leyendaValor}>{distribucion.activos}</span>
                                </div>
                                <span className={estilos.leyendaPorcentaje}>
                                    {((distribucion.activos / totalContratos) * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className={estilos.leyendaItem}>
                                <div className={`${estilos.leyendaDot} ${estilos.pagados}`}></div>
                                <div className={estilos.leyendaInfo}>
                                    <span className={estilos.leyendaLabel}>Pagados</span>
                                    <span className={estilos.leyendaValor}>{distribucion.pagados}</span>
                                </div>
                                <span className={estilos.leyendaPorcentaje}>
                                    {((distribucion.pagados / totalContratos) * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className={estilos.leyendaItem}>
                                <div className={`${estilos.leyendaDot} ${estilos.vencidos}`}></div>
                                <div className={estilos.leyendaInfo}>
                                    <span className={estilos.leyendaLabel}>Incumplidos</span>
                                    <span className={estilos.leyendaValor}>{distribucion.vencidos}</span>
                                </div>
                                <span className={estilos.leyendaPorcentaje}>
                                    {((distribucion.vencidos / totalContratos) * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className={estilos.leyendaItem}>
                                <div className={`${estilos.leyendaDot} ${estilos.otros}`}></div>
                                <div className={estilos.leyendaInfo}>
                                    <span className={estilos.leyendaLabel}>Otros</span>
                                    <span className={estilos.leyendaValor}>{distribucion.otros}</span>
                                </div>
                                <span className={estilos.leyendaPorcentaje}>
                                    {((distribucion.otros / totalContratos) * 100).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Análisis adicional */}
                    <div className={estilos.analisisContainer}>
                        <div className={estilos.analisisItem}>
                            <div className={estilos.analisisHeader}>
                                <BarChart3 size={18} />
                                <span>Tasa de Cobro</span>
                            </div>
                            <div className={estilos.analisisBarraContainer}>
                                <div 
                                    className={`${estilos.analisisBarra} ${estilos.success}`}
                                    style={{ width: `${((distribucion.pagados / totalContratos) * 100).toFixed(1)}%` }}
                                >
                                    <span className={estilos.analisisBarraPorcentaje}>
                                        {((distribucion.pagados / totalContratos) * 100).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className={estilos.analisisItem}>
                            <div className={estilos.analisisHeader}>
                                <HandCoins size={18} />
                                <span>Promedio por Contrato</span>
                            </div>
                            <div className={estilos.analisisValor}>
                                {formatearMoneda(
                                    metricas && metricas.contratosActivos > 0
                                        ? metricas.saldoPendiente / metricas.contratosActivos
                                        : 0
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Planes destacados */}
                <div className={`${estilos.cardPlanes} ${estilos[tema]}`}>
                    <div className={estilos.cardPlanesHeader}>
                        <div>
                            <h3 className={estilos.cardPlanesTitulo}>
                                <BadgePercent size={22} />
                                Planes de Financiamiento
                            </h3>
                            <p className={estilos.cardPlanesSubtitulo}>Planes activos disponibles</p>
                        </div>
                        <Link href="/admin/planes" className={estilos.verTodosLink}>
                            Ver todos <ArrowRight size={16} />
                        </Link>
                    </div>

                    {planes.length === 0 ? (
                        <div className={estilos.planesVacio}>
                            <Image 
                                src="/financias/credit-card-visa.svg" 
                                alt="" 
                                width={100} 
                                height={100}
                            />
                            <span>No hay planes activos</span>
                            <Link href="/admin/planes/nuevo" className={estilos.btnCrearPlan}>
                                <Plus size={18} />
                                Crear Plan
                            </Link>
                        </div>
                    ) : (
                        <div className={estilos.planesLista}>
                            {planes.map((plan) => (
                                <Link
                                    key={plan.id}
                                    href={`/admin/planes/ver/${plan.id}`}
                                    className={estilos.planItem}
                                >
                                    <div className={estilos.planIcono}>
                                        <CreditCard size={24} />
                                    </div>
                                    <div className={estilos.planInfo}>
                                        <span className={estilos.planNombre}>{plan.nombre}</span>
                                        <span className={estilos.planDetalles}>
                                            {plan.plazo_meses} meses • {parseFloat(plan.tasa_interes_anual || 0).toFixed(1)}% anual
                                        </span>
                                    </div>
                                    <div className={estilos.planBadge}>
                                        {parseFloat(plan.pago_inicial_minimo_pct || 0).toFixed(0)}% inicial
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    <Link href="/admin/planes/nuevo" className={estilos.btnNuevoPlan}>
                        <Plus size={20} />
                        <span>Crear Nuevo Plan</span>
                    </Link>
                </div>
            </div>

            {/* ============ ALERTAS PRIORITARIAS ============ */}
            {alertas.length > 0 && (
                <div className={`${estilos.panel} ${estilos.panelAlertas} ${estilos[tema]}`}>
                    <div className={estilos.panelHeader}>
                        <h2 className={estilos.panelTitulo}>
                            <AlertTriangle size={24} />
                            <span>Alertas Prioritarias</span>
                        </h2>
                        <Link href="/admin/alertas" className={estilos.btnVerTodas}>
                            Ver todas <ArrowRight size={16} />
                        </Link>
                    </div>
                    <div className={estilos.alertasLista}>
                        {alertas.map((alerta) => (
                            <div key={alerta.id} className={estilos.alertaItem}>
                                <div className={estilos.alertaIcono}>
                                    <AlertCircle size={24} />
                                </div>
                                <div className={estilos.alertaInfo}>
                                    <div className={estilos.alertaTitulo}>{alerta.titulo}</div>
                                    <div className={estilos.alertaDetalle}>
                                        {alerta.cliente_nombre} • {alerta.numero_contrato}
                                    </div>
                                </div>
                                <div className={estilos.alertaAcciones}>
                                    <button className={estilos.btnAccion} title="Llamar">
                                        <Phone size={18} />
                                    </button>
                                    <button className={estilos.btnAccion} title="WhatsApp">
                                        <MessageCircle size={18} />
                                    </button>
                                    <Link
                                        href={`/admin/contratos/ver/${alerta.contrato_id}`}
                                        className={estilos.btnAccion}
                                        title="Ver contrato"
                                    >
                                        <Eye size={18} />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ============ TABLA DE CONTRATOS ============ */}
            <div className={`${estilos.panel} ${estilos[tema]}`}>
                <div className={estilos.panelHeader}>
                    <h2 className={estilos.panelTitulo}>
                        <Receipt size={24} />
                        <span>Contratos de Financiamiento</span>
                    </h2>
                    <div className={estilos.panelControles}>
                        <div className={estilos.inputConIcono}>
                            <Search size={20} className={estilos.iconoInput} />
                            <input
                                type="text"
                                placeholder="Buscar contrato, cliente, NCF..."
                                className={estilos.inputBuscar}
                                value={buscar}
                                onChange={(e) => setBuscar(e.target.value)}
                            />
                        </div>
                        <div className={estilos.selectConIcono}>
                            <Filter size={18} className={estilos.iconoSelect} />
                            <select
                                className={estilos.selectFiltro}
                                value={filtroEstado}
                                onChange={(e) => setFiltroEstado(e.target.value)}
                            >
                                <option value="">Todos los estados</option>
                                <option value="activo">Activos</option>
                                <option value="pagado">Pagados</option>
                                <option value="incumplido">Incumplidos</option>
                                <option value="reestructurado">Reestructurados</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className={estilos.tablaContenedor}>
                    <table className={estilos.tabla}>
                        <thead>
                            <tr>
                                <th>Contrato</th>
                                <th>Cliente</th>
                                <th>Plan</th>
                                <th>Monto Financiado</th>
                                <th>Saldo Pendiente</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contratos.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className={estilos.sinDatos}>
                                        <Image 
                                            src="/financias/wallet 2.svg" 
                                            alt="" 
                                            width={80} 
                                            height={80}
                                            style={{ opacity: 0.5 }}
                                        />
                                        <span>No hay contratos para mostrar</span>
                                    </td>
                                </tr>
                            ) : (
                                contratos.slice(0, 10).map((contrato) => (
                                    <tr key={contrato.id} className={estilos.filaTabla}>
                                        <td>
                                            <div className={estilos.contratoNumero}>
                                                {contrato.numero_contrato}
                                            </div>
                                            <div className={estilos.contratoFecha}>
                                                <CalendarClock size={12} />
                                                {formatearFecha(contrato.fecha_contrato)}
                                            </div>
                                        </td>
                                        <td>
                                            <div className={estilos.clienteNombre}>
                                                {contrato.cliente_nombre}
                                            </div>
                                            <div className={estilos.clienteDoc}>
                                                {contrato.cliente_documento}
                                            </div>
                                        </td>
                                        <td className={estilos.planNombreTabla}>{contrato.plan_nombre}</td>
                                        <td className={estilos.monto}>
                                            {formatearMoneda(contrato.monto_financiado)}
                                        </td>
                                        <td className={estilos.monto}>
                                            {formatearMoneda(contrato.saldo_pendiente)}
                                        </td>
                                        <td>
                                            <span className={`${estilos.badge} ${estilos[obtenerColorEstado(contrato.estado)]}`}>
                                                {contrato.estado === 'activo' && <CheckCircle size={12} />}
                                                {contrato.estado === 'pagado' && <Banknote size={12} />}
                                                {contrato.estado === 'incumplido' && <XCircle size={12} />}
                                                {contrato.estado === 'reestructurado' && <RefreshCw size={12} />}
                                                {contrato.estado}
                                            </span>
                                        </td>
                                        <td>
                                            <Link
                                                href={`/admin/contratos/ver/${contrato.id}`}
                                                className={estilos.btnVer}
                                            >
                                                <Eye size={16} />
                                                Ver detalles
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {contratos.length > 10 && (
                    <div className={estilos.tablaFooter}>
                        <Link href="/admin/contratos" className={estilos.btnVerTodosContratos}>
                            Ver todos los contratos ({contratos.length})
                            <ArrowRight size={18} />
                        </Link>
                    </div>
                )}
            </div>

            {/* ============ FOOTER CON RECURSOS ============ */}
            <div className={estilos.footerRecursos}>
                <div className={estilos.recursoCard}>
                    <Image src="/financias/pos-machine.svg" alt="" width={60} height={60} />
                    <h4>Sistema POS</h4>
                    <p>Procesa pagos directamente desde el punto de venta</p>
                    <Link href="/pos">Ir al POS <ArrowRight size={14} /></Link>
                </div>
                <div className={estilos.recursoCard}>
                    <Image src="/financias/bank.svg" alt="" width={60} height={60} />
                    <h4>Reportes Financieros</h4>
                    <p>Genera informes detallados de cobranza y cartera</p>
                    <Link href="/admin/reportes">Ver Reportes <ArrowRight size={14} /></Link>
                </div>
                <div className={estilos.recursoCard}>
                    <Image src="/financias/credit-card-master.svg" alt="" width={60} height={60} />
                    <h4>Métodos de Pago</h4>
                    <p>Configura formas de pago aceptadas</p>
                    <Link href="/admin/configuracion">Configurar <ArrowRight size={14} /></Link>
                </div>
            </div>
        </div>
    )
}
