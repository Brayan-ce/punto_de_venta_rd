"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
    obtenerClientesConCredito,
    obtenerEstadisticasCredito,
    obtenerAlertasCredito
} from "./servidor"
import estilos from "./depuracion.module.css"

export default function DepuracionAdmin() {
    const router = useRouter()

    // Estados
    const [tema, setTema] = useState("light")
    const [cargando, setCargando] = useState(true)
    const [clientes, setClientes] = useState([])
    const [estadisticas, setEstadisticas] = useState(null)
    const [alertas, setAlertas] = useState([])
    const [tabActiva, setTabActiva] = useState("dashboard")

    // Filtros
    const [busqueda, setBusqueda] = useState("")
    const [filtroEstado, setFiltroEstado] = useState("todos")
    const [filtroClasificacion, setFiltroClasificacion] = useState("todos")

    // Tema
    useEffect(() => {
        const temaLocal = localStorage.getItem("tema") || "light"
        setTema(temaLocal)

        const manejarCambioTema = () => {
            setTema(localStorage.getItem("tema") || "light")
        }

        window.addEventListener("temaChange", manejarCambioTema)
        window.addEventListener("storage", manejarCambioTema)

        return () => {
            window.removeEventListener("temaChange", manejarCambioTema)
            window.removeEventListener("storage", manejarCambioTema)
        }
    }, [])

    // Cargar datos
    useEffect(() => {
        cargarDatos()
    }, [])

    const cargarDatos = async () => {
        setCargando(true)
        try {
            const [clientesRes, statsRes, alertasRes] = await Promise.all([
                obtenerClientesConCredito(),
                obtenerEstadisticasCredito(),
                obtenerAlertasCredito()
            ])

            if (clientesRes.success) setClientes(clientesRes.clientes)
            if (statsRes.success) setEstadisticas(statsRes.estadisticas)
            if (alertasRes.success) setAlertas(alertasRes.alertas)

        } catch (error) {
            console.error("Error al cargar datos:", error)
        } finally {
            setCargando(false)
        }
    }

    // Filtrado de clientes
    const clientesFiltrados = useMemo(() => {
        return clientes.filter(cliente => {
            const busquedaLower = busqueda.toLowerCase()
            const coincideBusqueda =
                cliente.nombreCompleto.toLowerCase().includes(busquedaLower) ||
                cliente.numeroDocumento?.toLowerCase().includes(busquedaLower) ||
                cliente.telefono?.toLowerCase().includes(busquedaLower)

            const coincideEstado =
                filtroEstado === "todos" ||
                cliente.estadoCredito === filtroEstado

            const coincideClasificacion =
                filtroClasificacion === "todos" ||
                cliente.clasificacion === filtroClasificacion

            return coincideBusqueda && coincideEstado && coincideClasificacion
        })
    }, [clientes, busqueda, filtroEstado, filtroClasificacion])

    // Utilidades
    const formatearMoneda = (valor) =>
        new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(valor || 0)

    const formatearFecha = (fecha) => {
        if (!fecha) return "N/A"
        return new Date(fecha).toLocaleDateString("es-DO")
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando módulo de depuración...</span>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* HEADER */}
            <div className={estilos.header}>
                <div className={estilos.tituloArea}>
                    <div className={estilos.tituloIcono}>
                        <ion-icon name="analytics-outline"></ion-icon>
                        <h1 className={estilos.titulo}>Evaluación y Control de Crédito</h1>
                    </div>
                    <p className={estilos.subtitulo}>
                        Gestión integral del crédito comercial de clientes
                    </p>
                </div>
                <button
                    className={estilos.btnRefrescar}
                    onClick={cargarDatos}
                    title="Refrescar datos"
                >
                    <ion-icon name="refresh-outline"></ion-icon>
                    <span>Refrescar</span>
                </button>
            </div>

            {/* ESTADÍSTICAS */}
            {estadisticas && (
                <div className={estilos.stats}>
                    <div className={estilos.statCard}>
                        <div className={`${estilos.statIcono} ${estilos.primary}`}>
                            <ion-icon name="people-outline"></ion-icon>
                        </div>
                        <div className={estilos.statInfo}>
                            <span className={estilos.statLabel}>Total Clientes</span>
                            <span className={estilos.statValor}>{estadisticas.totalClientes}</span>
                            <span className={estilos.statDetalle}>
                                {estadisticas.clientesActivos} activos
                            </span>
                        </div>
                    </div>

                    <div className={estilos.statCard}>
                        <div className={`${estilos.statIcono} ${estilos.success}`}>
                            <ion-icon name="card-outline"></ion-icon>
                        </div>
                        <div className={estilos.statInfo}>
                            <span className={estilos.statLabel}>Crédito Otorgado</span>
                            <span className={estilos.statValor}>
                                {formatearMoneda(estadisticas.creditoOtorgado).replace('.00', '')}
                            </span>
                            <span className={estilos.statDetalle}>
                                {formatearMoneda(estadisticas.creditoDisponible).replace('.00', '')} disponible
                            </span>
                        </div>
                    </div>

                    <div className={estilos.statCard}>
                        <div className={`${estilos.statIcono} ${estilos.danger}`}>
                            <ion-icon name="alert-circle-outline"></ion-icon>
                        </div>
                        <div className={estilos.statInfo}>
                            <span className={estilos.statLabel}>Deuda Vencida</span>
                            <span className={estilos.statValor}>
                                {formatearMoneda(estadisticas.deudaVencida).replace('.00', '')}
                            </span>
                            <span className={estilos.statDetalle}>Requiere atención</span>
                        </div>
                    </div>

                    <div className={estilos.statCard}>
                        <div className={`${estilos.statIcono} ${estilos.warning}`}>
                            <ion-icon name="lock-closed-outline"></ion-icon>
                        </div>
                        <div className={estilos.statInfo}>
                            <span className={estilos.statLabel}>Clientes Bloqueados</span>
                            <span className={estilos.statValor}>{estadisticas.clientesBloqueados}</span>
                            <span className={estilos.statDetalle}>Por morosidad</span>
                        </div>
                    </div>
                </div>
            )}

            {/* NAVEGACIÓN TABS */}
            <div className={estilos.tabsContenedor}>
                <nav className={estilos.tabs}>
                    <button
                        className={`${estilos.tab} ${tabActiva === "dashboard" ? estilos.tabActiva : ""}`}
                        onClick={() => setTabActiva("dashboard")}
                    >
                        <ion-icon name="bar-chart-outline"></ion-icon>
                        <span>Dashboard</span>
                    </button>
                    <button
                        className={`${estilos.tab} ${tabActiva === "clientes" ? estilos.tabActiva : ""}`}
                        onClick={() => setTabActiva("clientes")}
                    >
                        <ion-icon name="people-outline"></ion-icon>
                        <span>Clientes</span>
                        <span className={estilos.badge}>{clientes.length}</span>
                    </button>
                    <button
                        className={`${estilos.tab} ${tabActiva === "alertas" ? estilos.tabActiva : ""}`}
                        onClick={() => setTabActiva("alertas")}
                    >
                        <ion-icon name="notifications-outline"></ion-icon>
                        <span>Alertas</span>
                        {estadisticas?.alertasActivas > 0 && (
                            <span className={`${estilos.badge} ${estilos.badgeDanger}`}>
                                {estadisticas.alertasActivas}
                            </span>
                        )}
                    </button>
                </nav>
            </div>

            {/* CONTENIDO DE TABS */}
            <div className={estilos.tabContent}>
                {tabActiva === "dashboard" && estadisticas && (
                    <TabDashboard
                        estadisticas={estadisticas}
                        clientes={clientes}
                        formatearMoneda={formatearMoneda}
                        formatearFecha={formatearFecha}
                        estilos={estilos}
                    />
                )}

                {tabActiva === "clientes" && (
                    <TabClientes
                        clientes={clientesFiltrados}
                        busqueda={busqueda}
                        setBusqueda={setBusqueda}
                        filtroEstado={filtroEstado}
                        setFiltroEstado={setFiltroEstado}
                        filtroClasificacion={filtroClasificacion}
                        setFiltroClasificacion={setFiltroClasificacion}
                        router={router}
                        formatearMoneda={formatearMoneda}
                        estilos={estilos}
                        tema={tema}
                    />
                )}

                {tabActiva === "alertas" && (
                    <TabAlertas
                        alertas={alertas}
                        router={router}
                        formatearMoneda={formatearMoneda}
                        formatearFecha={formatearFecha}
                        estilos={estilos}
                    />
                )}
            </div>
        </div>
    )
}

// ============================================
// TAB: DASHBOARD
// ============================================
function TabDashboard({ estadisticas, clientes, formatearMoneda, formatearFecha, estilos }) {
    const totalClientes = estadisticas.totalClientes || 1

    // Próximos vencimientos
    const proximosVencimientos = useMemo(() => {
        return clientes
            .filter(c => c.fechaProximoVencimiento && c.estadoCredito !== 'bloqueado')
            .sort((a, b) => new Date(a.fechaProximoVencimiento) - new Date(b.fechaProximoVencimiento))
            .slice(0, 5)
    }, [clientes])

    return (
        <div className={estilos.dashboardGrid}>
            {/* Distribución por Clasificación */}
            <div className={estilos.card}>
                <h3 className={estilos.cardTitulo}>
                    <ion-icon name="ribbon-outline"></ion-icon>
                    Distribución por Clasificación
                </h3>
                <div className={estilos.clasificacionBars}>
                    <ClasificacionBar
                        letra="A"
                        label="Excelente"
                        cantidad={estadisticas.clasificacionA}
                        total={totalClientes}
                        color="success"
                        estilos={estilos}
                    />
                    <ClasificacionBar
                        letra="B"
                        label="Bueno"
                        cantidad={estadisticas.clasificacionB}
                        total={totalClientes}
                        color="primary"
                        estilos={estilos}
                    />
                    <ClasificacionBar
                        letra="C"
                        label="Regular"
                        cantidad={estadisticas.clasificacionC}
                        total={totalClientes}
                        color="warning"
                        estilos={estilos}
                    />
                    <ClasificacionBar
                        letra="D"
                        label="Moroso"
                        cantidad={estadisticas.clasificacionD}
                        total={totalClientes}
                        color="danger"
                        estilos={estilos}
                    />
                </div>
            </div>

            {/* Próximos Vencimientos */}
            <div className={estilos.card}>
                <h3 className={estilos.cardTitulo}>
                    <ion-icon name="time-outline"></ion-icon>
                    Próximos Vencimientos
                </h3>
                <div className={estilos.vencimientosList}>
                    {proximosVencimientos.length > 0 ? (
                        proximosVencimientos.map(cliente => (
                            <div key={cliente.id} className={estilos.vencimientoItem}>
                                <div className={estilos.vencimientoInfo}>
                                    <strong>{cliente.nombreCompleto}</strong>
                                    <small>{cliente.numeroDocumento}</small>
                                </div>
                                <div className={estilos.vencimientoDetalle}>
                                    <span className={estilos.monto}>
                                        {formatearMoneda(cliente.saldoUtilizado)}
                                    </span>
                                    <small>{formatearFecha(cliente.fechaProximoVencimiento)}</small>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className={estilos.vacio}>
                            <ion-icon name="checkmark-circle-outline"></ion-icon>
                            <p>No hay vencimientos próximos</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ============================================
// TAB: CLIENTES
// ============================================
function TabClientes({
    clientes,
    busqueda,
    setBusqueda,
    filtroEstado,
    setFiltroEstado,
    filtroClasificacion,
    setFiltroClasificacion,
    router,
    formatearMoneda,
    estilos,
    tema
}) {
    return (
        <div>
            {/* Filtros */}
            <div className={estilos.filtros}>
                <div className={estilos.busqueda}>
                    <ion-icon name="search-outline"></ion-icon>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, documento o teléfono..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className={estilos.inputBusqueda}
                    />
                </div>

                <div className={estilos.chips}>
                    <span className={estilos.chipLabel}>Estado:</span>
                    {["todos", "normal", "atrasado", "bloqueado", "suspendido"].map(estado => (
                        <button
                            key={estado}
                            className={`${estilos.chip} ${filtroEstado === estado ? estilos.chipActivo : ""}`}
                            onClick={() => setFiltroEstado(estado)}
                        >
                            {estado.charAt(0).toUpperCase() + estado.slice(1)}
                        </button>
                    ))}
                </div>

                <div className={estilos.chips}>
                    <span className={estilos.chipLabel}>Clasificación:</span>
                    {["todos", "A", "B", "C", "D"].map(clasificacion => (
                        <button
                            key={clasificacion}
                            className={`${estilos.chip} ${filtroClasificacion === clasificacion ? estilos.chipActivo : ""}`}
                            onClick={() => setFiltroClasificacion(clasificacion)}
                        >
                            {clasificacion === "todos" ? "Todos" : `Clase ${clasificacion}`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tabla de clientes */}
            <div className={estilos.tablaWrapper}>
                <table className={estilos.tabla}>
                    <thead>
                        <tr className={estilos[tema]}>
                            <th>Cliente</th>
                            <th>Límite</th>
                            <th>Utilizado</th>
                            <th>Disponible</th>
                            <th>Uso %</th>
                            <th>Clasificación</th>
                            <th>Estado</th>
                            <th>Deuda Vencida</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clientes.map(cliente => (
                            <tr key={cliente.id} className={estilos[tema]}>
                                <td>
                                    <div className={estilos.clienteCell}>
                                        <div className={estilos.avatarSmall}>
                                            {cliente.fotoUrl ? (
                                                <img src={cliente.fotoUrl} alt="" />
                                            ) : (
                                                <ion-icon name="person-outline"></ion-icon>
                                            )}
                                        </div>
                                        <div>
                                            <strong>{cliente.nombreCompleto}</strong>
                                            <small>{cliente.numeroDocumento}</small>
                                        </div>
                                    </div>
                                </td>
                                <td>{formatearMoneda(cliente.limiteCredito)}</td>
                                <td>{formatearMoneda(cliente.saldoUtilizado)}</td>
                                <td className={cliente.saldoDisponible <= 0 ? estilos.textDanger : ""}>
                                    {formatearMoneda(cliente.saldoDisponible)}
                                </td>
                                <td>
                                    <div className={estilos.progressCell}>
                                        <div className={estilos.progressBar}>
                                            <div
                                                className={estilos.progressFill}
                                                style={{
                                                    width: `${cliente.porcentajeUso}%`,
                                                    backgroundColor:
                                                        cliente.porcentajeUso >= 90 ? 'var(--color-danger)' :
                                                            cliente.porcentajeUso >= 70 ? 'var(--color-warning)' :
                                                                'var(--color-success)'
                                                }}
                                            ></div>
                                        </div>
                                        <span>{cliente.porcentajeUso}%</span>
                                    </div>
                                </td>
                                <td>
                                    <span className={`${estilos.badgeClasificacion} ${estilos[`clasificacion${cliente.clasificacion}`]}`}>
                                        {cliente.clasificacion}
                                    </span>
                                    <small className={estilos.scoreText}>{cliente.scoreCrediticio}</small>
                                </td>
                                <td>
                                    <span className={`${estilos.badgeEstado} ${estilos[cliente.estadoCredito]}`}>
                                        {cliente.estadoCredito}
                                    </span>
                                </td>
                                <td className={cliente.montoVencido > 0 ? estilos.textDanger : ""}>
                                    {cliente.montoVencido > 0 ? formatearMoneda(cliente.montoVencido) : '-'}
                                </td>
                                <td>
                                    <button
                                        className={estilos.btnVer}
                                        onClick={() => router.push(`/admin/clientes/ver/${cliente.id}?tab=credito`)}
                                        title="Ver detalle de crédito"
                                    >
                                        <ion-icon name="eye-outline"></ion-icon>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {clientes.length === 0 && (
                    <div className={estilos.vacio}>
                        <ion-icon name="search-outline"></ion-icon>
                        <p>No se encontraron clientes con los filtros seleccionados</p>
                    </div>
                )}
            </div>
        </div>
    )
}

// ============================================
// TAB: ALERTAS
// ============================================
function TabAlertas({ alertas, router, formatearMoneda, formatearFecha, estilos }) {
    const obtenerIconoAlerta = (tipo) => {
        const iconos = {
            credito_vencido: "alert-circle",
            vencimiento_proximo: "time",
            credito_excedido: "warning",
            atraso_grave: "close-circle",
            clasificacion_degradada: "trending-down"
        }
        return iconos[tipo] || "information-circle"
    }

    return (
        <div className={estilos.alertasGrid}>
            {alertas.length > 0 ? (
                alertas.map(alerta => (
                    <div key={alerta.id} className={`${estilos.alertaCard} ${estilos[`severidad${alerta.severidad.charAt(0).toUpperCase() + alerta.severidad.slice(1)}`]}`}>
                        <div className={estilos.alertaIcono}>
                            <ion-icon name={obtenerIconoAlerta(alerta.tipoAlerta)}></ion-icon>
                        </div>
                        <div className={estilos.alertaContenido}>
                            <div className={estilos.alertaHeader}>
                                <h4>{alerta.titulo}</h4>
                                <span className={`${estilos.badgeSeveridad} ${estilos[alerta.severidad]}`}>
                                    {alerta.severidad}
                                </span>
                            </div>
                            <p className={estilos.alertaMensaje}>{alerta.mensaje}</p>
                            <div className={estilos.alertaDetalles}>
                                <div>
                                    <strong>{alerta.clienteNombre}</strong>
                                    <small>{alerta.clienteDocumento}</small>
                                </div>
                                {alerta.montoRelacionado > 0 && (
                                    <span className={estilos.alertaMonto}>
                                        {formatearMoneda(alerta.montoRelacionado)}
                                    </span>
                                )}
                            </div>
                            <div className={estilos.alertaFooter}>
                                <small>{formatearFecha(alerta.fechaGeneracion)}</small>
                                <button
                                    className={estilos.btnVerCliente}
                                    onClick={() => router.push(`/admin/clientes/ver/${alerta.clienteId}?tab=credito`)}
                                >
                                    Ver Cliente
                                    <ion-icon name="arrow-forward-outline"></ion-icon>
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className={estilos.vacio}>
                    <ion-icon name="checkmark-circle-outline"></ion-icon>
                    <p>No hay alertas activas</p>
                </div>
            )}
        </div>
    )
}

// ============================================
// COMPONENTE: Barra de Clasificación
// ============================================
function ClasificacionBar({ letra, label, cantidad, total, color, estilos }) {
    const porcentaje = total > 0 ? Math.round((cantidad / total) * 100) : 0

    return (
        <div className={estilos.clasificacionBar}>
            <div className={estilos.clasificacionHeader}>
                <div>
                    <span className={estilos.clasificacionLetra}>{letra}</span>
                    <span className={estilos.clasificacionLabel}>{label}</span>
                </div>
                <span className={estilos.clasificacionValor}>
                    {cantidad} ({porcentaje}%)
                </span>
            </div>
            <div className={estilos.barraProgreso}>
                <div
                    className={`${estilos.barraFill} ${estilos[color]}`}
                    style={{ width: `${porcentaje}%` }}
                ></div>
            </div>
        </div>
    )
}
