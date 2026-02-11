"use client"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { obtenerCotizaciones, eliminarCotizacion } from "./servidor"
import { crearFormateadorMoneda } from "./lib"
import { FILTROS_ESTADO } from "./constants"
import CotizacionCard from "./componentes/CotizacionCard"
import TablaCotizaciones from "./componentes/TablaCotizaciones"
import estilos from "./cotizaciones.module.css"

/**
 * Contenedor principal para la gestión de cotizaciones
 * Maneja estado, carga de datos y pasa props a componentes de UI
 */
export default function CotizacionesAdmin() {
    const router = useRouter()

    // -------------------------------
    // Estados generales
    // -------------------------------
    const [tema, setTema] = useState("light")
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [cotizaciones, setCotizaciones] = useState([])

    // -------------------------------
    // Filtros y búsqueda
    // -------------------------------
    const [busqueda, setBusqueda] = useState("")
    const [filtroEstado, setFiltroEstado] = useState("todos")
    const [vistaActual, setVistaActual] = useState("cards")

    // -------------------------------
    // Memoización de formateador (se crea una sola vez)
    // -------------------------------
    const formateadorMoneda = useMemo(() => crearFormateadorMoneda(), [])

    // -------------------------------
    // Tema desde localStorage
    // -------------------------------
    useEffect(() => {
        const temaLocal = localStorage.getItem("tema") || "light"
        setTema(temaLocal)

        const manejarCambioTema = () => {
            const nuevoTema = localStorage.getItem("tema") || "light"
            setTema(nuevoTema)
        }

        window.addEventListener("temaChange", manejarCambioTema)
        window.addEventListener("storage", manejarCambioTema)

        return () => {
            window.removeEventListener("temaChange", manejarCambioTema)
            window.removeEventListener("storage", manejarCambioTema)
        }
    }, [])

    // -------------------------------
    // Cargar cotizaciones (memoizado con useCallback)
    // -------------------------------
    const cargarCotizaciones = useCallback(async () => {
        setCargando(true)
        try {
            const resultado = await obtenerCotizaciones({
                buscar: busqueda,
                estado: filtroEstado !== "todos" ? filtroEstado : null
            })
            if (resultado.success) {
                setCotizaciones(resultado.cotizaciones)
            }
        } catch (error) {
            console.error("Error al cargar cotizaciones:", error)
        } finally {
            setCargando(false)
        }
    }, [busqueda, filtroEstado])

    // Cargar al montar
    useEffect(() => {
        cargarCotizaciones()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Debounce para búsqueda y filtros
    useEffect(() => {
        const timer = setTimeout(() => {
            cargarCotizaciones()
        }, 300)
        return () => clearTimeout(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [busqueda, filtroEstado])

    // -------------------------------
    // Eliminar cotización (memoizado)
    // -------------------------------
    const manejarEliminar = useCallback(async (id, numeroCotizacion) => {
        if (!confirm(`¿Estás seguro de que deseas eliminar la cotización "${numeroCotizacion}"?\n\nEsta acción no se puede deshacer.`)) {
            return
        }

        setProcesando(true)
        // Optimistic UI: eliminar inmediatamente de la UI
        setCotizaciones((prev) => prev.filter((c) => c.id !== id))

        try {
            const resultado = await eliminarCotizacion(id)
            if (!resultado.success) {
                alert(resultado.mensaje || "Error al eliminar cotización")
                // Recargar si falla para restaurar estado
                await cargarCotizaciones()
            }
        } catch (error) {
            console.error("Error al eliminar:", error)
            alert("Error al eliminar la cotización")
            // Recargar si falla para restaurar estado
            await cargarCotizaciones()
        } finally {
            setProcesando(false)
        }
    }, [cargarCotizaciones])

    // -------------------------------
    // Handlers memoizados
    // -------------------------------
    const handleNuevaCotizacion = useCallback(() => {
        router.push("/admin/cotizaciones/nuevo")
    }, [router])

    const handleCambiarVista = useCallback((vista) => {
        setVistaActual(vista)
    }, [])

    const handleLimpiarFiltros = useCallback(() => {
        setBusqueda("")
        setFiltroEstado("todos")
    }, [])

    // -------------------------------
    // Valores computados
    // -------------------------------
    const realmenteNoHayCotizaciones = useMemo(() => 
        !cargando && cotizaciones.length === 0 && !busqueda.trim() && filtroEstado === "todos",
        [cargando, cotizaciones.length, busqueda, filtroEstado]
    )

    const noHayResultadosBusqueda = useMemo(() => 
        !cargando && cotizaciones.length === 0 && (busqueda.trim() || filtroEstado !== "todos"),
        [cargando, cotizaciones.length, busqueda, filtroEstado]
    )

    // Calcular KPIs
    const kpis = useMemo(() => {
        const total = cotizaciones.length
        const pendientes = cotizaciones.filter(c => c.estado === 'enviada' || c.estado === 'borrador').length
        const aprobadas = cotizaciones.filter(c => c.estado === 'aprobada').length
        const totalMonto = cotizaciones.reduce((sum, c) => sum + (c.total || 0), 0)
        
        return {
            total,
            pendientes,
            aprobadas,
            totalMonto
        }
    }, [cotizaciones])

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>

            {/* ================= HEADER SUPERIOR ================= */}
            <div className={estilos.headerSuperior}>
                <div className={estilos.tituloArea}>
                    <h1 className={estilos.titulo}>Cotizaciones</h1>
                    <p className={estilos.subtitulo}>Gestiona tus presupuestos y cotizaciones</p>
                </div>
                <div className={estilos.headerButtons}>
                    <button
                        className={estilos.btnAccionRapida}
                        title="Refrescar"
                        onClick={cargarCotizaciones}
                    >
                        <ion-icon name="refresh-outline"></ion-icon>
                    </button>
                    <button
                        className={estilos.btnAccionRapida}
                        title="Exportar"
                    >
                        <ion-icon name="download-outline"></ion-icon>
                    </button>
                    <button
                        className={estilos.btnNuevo}
                        onClick={handleNuevaCotizacion}
                    >
                        <ion-icon name="add-outline"></ion-icon>
                        <span>Nueva Cotización</span>
                    </button>
                </div>
            </div>

            {/* ================= KPIs ================= */}
            <div className={estilos.kpisGrid}>
                <div className={estilos.kpiCard}>
                    <div className={estilos.kpiHeader}>
                        <span className={estilos.kpiLabel}>Cotizaciones</span>
                        <ion-icon name="document-text-outline" className={estilos.kpiIcon}></ion-icon>
                    </div>
                    <div className={estilos.kpiValor}>{kpis.total}</div>
                    <div className={estilos.kpiTendencia}>
                        <ion-icon name="trending-up-outline"></ion-icon>
                        <span>+12%</span>
                    </div>
                </div>
                <div className={estilos.kpiCard}>
                    <div className={estilos.kpiHeader}>
                        <span className={estilos.kpiLabel}>Pendientes</span>
                        <ion-icon name="time-outline" className={estilos.kpiIcon}></ion-icon>
                    </div>
                    <div className={estilos.kpiValor}>{kpis.pendientes}</div>
                    <div className={`${estilos.kpiTendencia} ${estilos.kpiTendenciaNegativa}`}>
                        <ion-icon name="trending-down-outline"></ion-icon>
                        <span>-5%</span>
                    </div>
                </div>
                <div className={estilos.kpiCard}>
                    <div className={estilos.kpiHeader}>
                        <span className={estilos.kpiLabel}>Aprobadas</span>
                        <ion-icon name="checkmark-circle-outline" className={estilos.kpiIcon}></ion-icon>
                    </div>
                    <div className={estilos.kpiValor}>{kpis.aprobadas}</div>
                    <div className={estilos.kpiTendencia}>
                        <ion-icon name="trending-up-outline"></ion-icon>
                        <span>+8%</span>
                    </div>
                </div>
                <div className={estilos.kpiCard}>
                    <div className={estilos.kpiHeader}>
                        <span className={estilos.kpiLabel}>Total RD$</span>
                        <ion-icon name="cash-outline" className={estilos.kpiIcon}></ion-icon>
                    </div>
                    <div className={estilos.kpiValor}>{formateadorMoneda.format(kpis.totalMonto)}</div>
                    <div className={estilos.kpiTendencia}>
                        <ion-icon name="trending-up-outline"></ion-icon>
                        <span>+15%</span>
                    </div>
                </div>
            </div>

            {/* ================= BÚSQUEDA Y FILTROS REORGANIZADOS ================= */}
            <div className={estilos.controles}>
                <div className={estilos.barraHerramientas}>
                    <div className={estilos.busqueda}>
                        <ion-icon name="search-outline"></ion-icon>
                        <input
                            type="text"
                            placeholder="Buscar por número o cliente..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className={estilos.inputBusqueda}
                        />
                    </div>

                    <div className={estilos.selectoresVista}>
                        <button
                            className={`${estilos.btnVista} ${vistaActual === 'cards' ? estilos.vistaActiva : ''}`}
                            onClick={() => handleCambiarVista('cards')}
                            title="Vista de Tarjetas"
                            aria-label="Vista de Tarjetas"
                        >
                            <ion-icon name="grid-outline"></ion-icon>
                        </button>
                        <button
                            className={`${estilos.btnVista} ${vistaActual === 'tabla' ? estilos.vistaActiva : ''}`}
                            onClick={() => handleCambiarVista('tabla')}
                            title="Vista de Tabla"
                            aria-label="Vista de Tabla"
                        >
                            <ion-icon name="list-outline"></ion-icon>
                        </button>
                    </div>
                </div>

                <div className={estilos.filtrosOrganizados}>
                    <div className={estilos.filtrosLabel}>
                        <ion-icon name="filter-outline"></ion-icon>
                        <span>Filtrar por estado:</span>
                    </div>
                    <div className={estilos.chips}>
                        {FILTROS_ESTADO.map((chip) => (
                            <button
                                key={chip.value}
                                className={`${estilos.chip} ${filtroEstado === chip.value ? estilos.chipActivo : ""} ${chip.clase ? estilos[chip.clase] : ""}`}
                                onClick={() => setFiltroEstado(chip.value)}
                                aria-pressed={filtroEstado === chip.value}
                            >
                                {chip.icon && <ion-icon name={chip.icon}></ion-icon>}
                                {chip.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ================= LISTA DE COTIZACIONES ================= */}
            {cargando ? (
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando cotizaciones...</span>
                </div>
            ) : realmenteNoHayCotizaciones ? (
                <div className={estilos.vacio}>
                    <ion-icon name="document-outline"></ion-icon>
                    <h3>No hay cotizaciones registradas</h3>
                    <p>Comienza agregando tu primera cotización</p>
                </div>
            ) : noHayResultadosBusqueda ? (
                <div className={estilos.sinResultados}>
                    <ion-icon name="search-outline"></ion-icon>
                    <h3>No se encontraron cotizaciones</h3>
                    <p>
                        {busqueda.trim()
                            ? `No hay cotizaciones que coincidan con "${busqueda}"`
                            : `No hay cotizaciones con el estado "${filtroEstado}"`
                        }
                    </p>
                    <button
                        className={estilos.btnLimpiarFiltros}
                        onClick={handleLimpiarFiltros}
                    >
                        <ion-icon name="close-circle-outline"></ion-icon>
                        <span>Limpiar filtros</span>
                    </button>
                </div>
            ) : vistaActual === "cards" ? (
                <div className={estilos.listaCotizaciones}>
                    {cotizaciones.map((cot) => (
                        <CotizacionCard
                            key={cot.id}
                            cotizacion={cot}
                            tema={tema}
                            router={router}
                            formateadorMoneda={formateadorMoneda}
                            estilos={estilos}
                            manejarEliminar={manejarEliminar}
                            procesando={procesando}
                        />
                    ))}
                </div>
            ) : (
                <TablaCotizaciones
                    cotizaciones={cotizaciones}
                    tema={tema}
                    router={router}
                    formateadorMoneda={formateadorMoneda}
                    estilos={estilos}
                    manejarEliminar={manejarEliminar}
                    procesando={procesando}
                />
            )}
        </div>
    )
}

