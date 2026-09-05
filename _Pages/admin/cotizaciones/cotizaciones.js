"use client"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { obtenerCotizaciones, eliminarCotizacion, obtenerDatosEmpresa } from "./servidor"
import { crearFormateadorMoneda } from "./lib"
import { FILTROS_ESTADO } from "./constants"
import CotizacionCard from "./componentes/CotizacionCard"
import TablaCotizaciones from "./componentes/TablaCotizaciones"
import { useLanguage } from "@/_Pages/admin/i18n"
import estilos from "./cotizaciones.module.css"
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

/**
 * Contenedor principal para la gestión de cotizaciones
 * Maneja estado, carga de datos y pasa props a componentes de UI
 */
export default function CotizacionesAdmin() {
    const router = useRouter()
    const { language } = useLanguage()
    const tr = (es, en) => (language === "en" ? en : es)

    // -------------------------------
    // Estados generales
    // -------------------------------
    const [tema, setTema] = useState("light")
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [cotizaciones, setCotizaciones] = useState([])
    const [empresa, setEmpresa] = useState(null)

    // -------------------------------
    // Filtros y búsqueda
    // -------------------------------
    const [busqueda, setBusqueda] = useState("")
    const [filtroEstado, setFiltroEstado] = useState("todos")
    const [vistaActual, setVistaActual] = useState("cards")

    // -------------------------------
    // Memoización de formateador (se crea una sola vez)
    // -------------------------------
    const formateadorMoneda = useMemo(() => crearFormateadorMoneda(language, empresa?.moneda || "DOP", empresa?.locale || null), [language, empresa])

    const formatearEstadoFiltro = useCallback((valor, etiquetaEs) => {
        const traducciones = {
            todos: tr("Todos", "All"),
            borrador: tr("Borrador", "Draft"),
            enviada: tr("Enviada", "Sent"),
            aprobada: tr("Aprobada", "Approved"),
            vencida: tr("Vencida", "Expired"),
            anulada: tr("Anulada", "Canceled")
        }
        return traducciones[valor] || etiquetaEs
    }, [tr])

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
        cargarEmpresa()

        return () => {
            window.removeEventListener("temaChange", manejarCambioTema)
            window.removeEventListener("storage", manejarCambioTema)
        }
    }, [])

    const cargarEmpresa = async () => {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresa(res.empresa)
    }

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
            console.error("Error loading quotes:", error)
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
        if (!confirm(tr(`¿Estas seguro de que deseas eliminar la cotizacion "${numeroCotizacion}"?\n\nEsta accion no se puede deshacer.`, `Are you sure you want to delete quote "${numeroCotizacion}"?\n\nThis action cannot be undone.`))) {
            return
        }

        setProcesando(true)
        // Optimistic UI: eliminar inmediatamente de la UI
        setCotizaciones((prev) => prev.filter((c) => c.id !== id))

        try {
            const resultado = await eliminarCotizacion(id)
            if (!resultado.success) {
                alert(resultado.mensaje || tr("Error al eliminar cotizacion", "Error deleting quote"))
                // Recargar si falla para restaurar estado
                await cargarCotizaciones()
            }
        } catch (error) {
            console.error("Error deleting quote:", error)
            alert(tr("Error al eliminar la cotizacion", "Error deleting quote"))
            // Recargar si falla para restaurar estado
            await cargarCotizaciones()
        } finally {
            setProcesando(false)
        }
    }, [cargarCotizaciones, tr])

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
                    <h1 className={estilos.titulo}>{tr("Cotizaciones", "Quotes")}</h1>
                    <p className={estilos.subtitulo}>{tr("Gestiona tus presupuestos y cotizaciones", "Manage your budgets and quotes")}</p>
                </div>
                <div className={estilos.headerButtons}>
                    <button
                        className={estilos.btnAccionRapida}
                        title={tr("Refrescar", "Refresh")}
                        onClick={cargarCotizaciones}
                    >
                        <ion-icon name="refresh-outline"></ion-icon>
                    </button>
                    <button
                        className={estilos.btnAccionRapida}
                        title={tr("Exportar", "Export")}
                    >
                        <ion-icon name="download-outline"></ion-icon>
                    </button>
                    <button
                        className={estilos.btnNuevo}
                        onClick={handleNuevaCotizacion}
                    >
                        <ion-icon name="add-outline"></ion-icon>
                        <span>{tr("Nueva Cotizacion", "New Quote")}</span>
                    </button>
                </div>
            </div>

            {/* ================= KPIs ================= */}
            <div className={estilos.kpisGrid}>
                <div className={estilos.kpiCard}>
                    <div className={estilos.kpiHeader}>
                        <span className={estilos.kpiLabel}>{tr("Cotizaciones", "Quotes")}</span>
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
                        <span className={estilos.kpiLabel}>{tr("Pendientes", "Pending")}</span>
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
                        <span className={estilos.kpiLabel}>{tr("Aprobadas", "Approved")}</span>
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
                        <span className={estilos.kpiLabel}>{tr("Total " + (empresa?.simbolo_moneda || "RD$"), "Total " + (empresa?.simbolo_moneda || "RD$"))}</span>
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
                            placeholder={tr("Buscar por numero o cliente...", "Search by number or customer...")}
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className={estilos.inputBusqueda}
                        />
                    </div>

                    <div className={estilos.selectoresVista}>
                        <button
                            className={`${estilos.btnVista} ${vistaActual === 'cards' ? estilos.vistaActiva : ''}`}
                            onClick={() => handleCambiarVista('cards')}
                            title={tr("Vista de tarjetas", "Card view")}
                            aria-label={tr("Vista de tarjetas", "Card view")}
                        >
                            <ion-icon name="grid-outline"></ion-icon>
                        </button>
                        <button
                            className={`${estilos.btnVista} ${vistaActual === 'tabla' ? estilos.vistaActiva : ''}`}
                            onClick={() => handleCambiarVista('tabla')}
                            title={tr("Vista de tabla", "Table view")}
                            aria-label={tr("Vista de tabla", "Table view")}
                        >
                            <ion-icon name="list-outline"></ion-icon>
                        </button>
                    </div>
                </div>

                <div className={estilos.filtrosOrganizados}>
                    <div className={estilos.filtrosLabel}>
                        <ion-icon name="filter-outline"></ion-icon>
                        <span>{tr("Filtrar por estado:", "Filter by status:")}</span>
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
                                {formatearEstadoFiltro(chip.value, chip.label)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ================= LISTA DE COTIZACIONES ================= */}
            {cargando ? (
                <LoadingScreen />
            ) : realmenteNoHayCotizaciones ? (
                <div className={estilos.vacio}>
                    <ion-icon name="document-outline"></ion-icon>
                    <h3>{tr("No hay cotizaciones registradas", "No quotes registered")}</h3>
                    <p>{tr("Comienza agregando tu primera cotizacion", "Start by adding your first quote")}</p>
                </div>
            ) : noHayResultadosBusqueda ? (
                <div className={estilos.sinResultados}>
                    <ion-icon name="search-outline"></ion-icon>
                    <h3>{tr("No se encontraron cotizaciones", "No quotes found")}</h3>
                    <p>
                        {busqueda.trim()
                            ? tr(`No hay cotizaciones que coincidan con "${busqueda}"`, `No quotes match "${busqueda}"`)
                            : tr(`No hay cotizaciones con el estado "${filtroEstado}"`, `No quotes with status "${filtroEstado}"`)
                        }
                    </p>
                    <button
                        className={estilos.btnLimpiarFiltros}
                        onClick={handleLimpiarFiltros}
                    >
                        <ion-icon name="close-circle-outline"></ion-icon>
                        <span>{tr("Limpiar filtros", "Clear filters")}</span>
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
                            language={language}
                            tr={tr}
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
                    language={language}
                    tr={tr}
                />
            )}
        </div>
    )
}

