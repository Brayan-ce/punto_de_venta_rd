"use client"
import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { obtenerClientes, eliminarCliente } from "./servidor"
import estilos from "./clientes.module.css"

export default function ClientesAdmin() {
    const router = useRouter()

    // -------------------------------
    // Estados generales
    // -------------------------------
    const [tema, setTema] = useState("light")
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [clientes, setClientes] = useState([])
    const [tiposDocumento, setTiposDocumento] = useState([])

    // -------------------------------
    // Filtros y búsqueda
    // -------------------------------
    const [busqueda, setBusqueda] = useState("")
    const [filtroEstado, setFiltroEstado] = useState("todos")
    const [vistaActual, setVistaActual] = useState("cards")

    // -------------------------------
    // Paginación
    // -------------------------------
    const [paginaActual, setPaginaActual] = useState(1)
    const itemsPorPagina = 10

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
    // Cargar clientes al montar
    // -------------------------------
    useEffect(() => {
        cargarClientes()
    }, [])

    const cargarClientes = async () => {
        setCargando(true)
        try {
            const resultado = await obtenerClientes()
            if (resultado.success) {
                setClientes(resultado.clientes)
                setTiposDocumento(resultado.tiposDocumento)
            } else {
                alert(resultado.mensaje || "Error al cargar clientes")
            }
        } catch (error) {
            console.error("Error al cargar clientes:", error)
            alert("Error al cargar datos")
        } finally {
            setCargando(false)
        }
    }

    // -------------------------------
    // Filtrado y búsqueda
    // -------------------------------
    const clientesFiltrados = useMemo(() => {
        const busquedaLower = busqueda.toLowerCase()

        const filtrados = clientes.filter((cliente) => {
            const coincideBusqueda =
                cliente.nombreCompleto.toLowerCase().includes(busquedaLower) ||
                (cliente.numeroDocumento?.toLowerCase() || "").includes(busquedaLower) ||
                (cliente.telefono?.toLowerCase() || "").includes(busquedaLower)

            const coincideFiltro =
                filtroEstado === "todos" ||
                cliente.credito?.estadoCredito === filtroEstado

            return coincideBusqueda && coincideFiltro
        })

        return filtrados
    }, [clientes, busqueda, filtroEstado])

    // Lógica de Paginación
    const totalPaginas = Math.ceil(clientesFiltrados.length / itemsPorPagina)
    const clientesPaginados = useMemo(() => {
        const inicio = (paginaActual - 1) * itemsPorPagina
        return clientesFiltrados.slice(inicio, inicio + itemsPorPagina)
    }, [clientesFiltrados, paginaActual])

    // Reset de página al cambiar filtros
    useEffect(() => {
        setPaginaActual(1)
    }, [busqueda, filtroEstado])

    // -------------------------------
    // Estadísticas generales
    // -------------------------------
    const stats = useMemo(() => ({
        total: clientes.length,
        activos: clientes.filter((c) => c.clienteActivo).length,
        creditoNormal: clientes.filter((c) => c.credito?.estadoCredito === "normal").length,
        atrasados: clientes.filter((c) => c.credito?.estadoCredito === "atrasado").length,
        bloqueados: clientes.filter((c) => c.credito?.estadoCredito === "bloqueado").length,
        deudaTotal: clientes.reduce((acc, c) => acc + (c.deuda?.total || 0), 0),
        deudaVencida: clientes.reduce((acc, c) => acc + (c.deuda?.vencida || 0), 0),
    }), [clientes])

    // -------------------------------
    // Utilidades
    // -------------------------------
    const formatearMoneda = (valor) =>
        new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(valor || 0)

    const obtenerColorBarra = (porcentaje) => {
        if (porcentaje < 50) return "var(--color-success)"
        if (porcentaje < 80) return "var(--color-warning)"
        return "var(--color-danger)"
    }

    const obtenerIconoEstado = (estado) => {
        const iconos = {
            normal: "checkmark-circle",
            atrasado: "time",
            bloqueado: "lock-closed"
        }
        return iconos[estado] || "help-circle"
    }

    // -------------------------------
    // Eliminar cliente
    // -------------------------------
    const manejarEliminar = async (id, nombre) => {
        if (!confirm(`¿Estás seguro de que deseas eliminar al cliente "${nombre}"?`)) return

        setProcesando(true)
        const clienteBackup = clientes
        setClientes((prev) => prev.filter((c) => c.id !== id))

        try {
            const resultado = await eliminarCliente(id)
            if (!resultado.success) {
                alert(resultado.mensaje || "Error al eliminar cliente")
                setClientes(clienteBackup)
            }
        } catch (error) {
            console.error("Error al eliminar:", error)
            alert("Error al eliminar el cliente")
            setClientes(clienteBackup)
        } finally {
            setProcesando(false)
        }
    }

    // -------------------------------
    // Configuración de estadísticas
    // -------------------------------
    const estadisticas = [
        {
            label: "Total Clientes",
            valor: stats.total,
            detalle: `${stats.activos} activos`,
            icon: "people-outline",
            color: "primary",
        },
        {
            label: "Crédito Normal",
            valor: stats.creditoNormal,
            detalle: "Al día",
            icon: "checkmark-circle-outline",
            color: "success",
        },
        {
            label: "Atrasados",
            valor: stats.atrasados,
            detalle: "Requieren atención",
            icon: "time-outline",
            color: "warning",
        },
        {
            label: "Deuda Vencida",
            valor: formatearMoneda(stats.deudaVencida),
            detalle: `De ${formatearMoneda(stats.deudaTotal)} total`,
            icon: "alert-circle-outline",
            color: "danger",
        },
    ]

    // -------------------------------
    // Configuración de filtros
    // -------------------------------
    const filtrosChips = [
        { label: "Todos", value: "todos", icon: null },
        { label: "Normal", value: "normal", icon: "checkmark-circle", clase: "chipSuccess" },
        { label: "Atrasados", value: "atrasado", icon: "time", clase: "chipWarning" },
        { label: "Bloqueados", value: "bloqueado", icon: "lock-closed", clase: "chipDanger" },
    ]

    // -------------------------------
    // Función para renderizar contenido de lista
    // -------------------------------
    const renderizarListaClientes = () => {
        if (cargando) {
            return (
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando cartera de clientes...</span>
                </div>
            )
        }

        // Si no hay clientes en total (base de datos vacía)
        if (clientes.length === 0) {
            return (
                <div className={estilos.vacio}>
                    <ion-icon name="people-outline"></ion-icon>
                    <h3>No hay clientes registrados</h3>
                    <p>Comienza agregando tu primer cliente</p>
                </div>
            )
        }

        // Si hay clientes pero el filtro no encuentra resultados
        if (clientesFiltrados.length === 0) {
            return (
                <div className={estilos.vacio}>
                    <ion-icon name="search-outline"></ion-icon>
                    <h3>No se encontraron resultados</h3>
                    <p>
                        {busqueda
                            ? `No hay clientes que coincidan con "${busqueda}"`
                            : `No hay clientes con estado "${filtroEstado}"`}
                    </p>
                </div>
            )
        }

        // Renderizar vista de cards o tabla
        if (vistaActual === "cards") {
            return (
                <div className={estilos.listaClientes}>
                    {clientesPaginados.map((cliente) => (
                        <ClienteCard
                            key={cliente.id}
                            cliente={cliente}
                            tema={tema}
                            router={router}
                            formatearMoneda={formatearMoneda}
                            obtenerColorBarra={obtenerColorBarra}
                            obtenerIconoEstado={obtenerIconoEstado}
                            estilos={estilos}
                        />
                    ))}
                </div>
            )
        }

        return (
            <TablaClientes
                clientesPaginados={clientesPaginados}
                tema={tema}
                router={router}
                formatearMoneda={formatearMoneda}
                obtenerColorBarra={obtenerColorBarra}
                estilos={estilos}
            />
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* ================= HEADER ================= */}
            <div className={estilos.header}>
                <div className={estilos.tituloArea}>
                    <h1 className={estilos.titulo}>Cartera de Clientes</h1>
                    <p className={estilos.subtitulo}>Gestión profesional de perfiles crediticios</p>
                </div>
                <div className={estilos.headerButtons}>
                    <button
                        className={estilos.btnDepuracion}
                        onClick={() => router.push("/admin/depuracion")}
                        disabled={procesando}
                        title="Ir a Depuración de Crédito"
                    >
                        <ion-icon name="analytics-outline"></ion-icon>
                        <span>Depuración</span>
                    </button>
                    <button
                        className={estilos.btnNuevo}
                        onClick={() => router.push("/admin/clientes/nuevo")}
                        disabled={procesando}
                    >
                        <ion-icon name="person-add-outline"></ion-icon>
                        <span>Nuevo Cliente</span>
                    </button>
                </div>
            </div>

            {/* ================= ESTADÍSTICAS ================= */}
            <div className={estilos.stats}>
                {estadisticas.map((stat, index) => (
                    <div key={index} className={estilos.statCard}>
                        <div className={`${estilos.statIcono} ${estilos[stat.color]}`}>
                            <ion-icon name={stat.icon}></ion-icon>
                        </div>
                        <div className={estilos.statInfo}>
                            <span className={estilos.statLabel}>{stat.label}</span>
                            <span className={estilos.statValor}>{stat.valor}</span>
                            <span className={estilos.statDetalle}>{stat.detalle}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ================= BÚSQUEDA Y FILTROS ================= */}
            <div className={estilos.controles}>
                <div className={estilos.barraHerramientas}>
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

                    <div className={estilos.selectoresVista}>
                        <button
                            className={`${estilos.btnVista} ${vistaActual === 'cards' ? estilos.vistaActiva : ''}`}
                            onClick={() => setVistaActual('cards')}
                            title="Vista de Tarjetas"
                            aria-label="Vista de Tarjetas"
                        >
                            <ion-icon name="grid-outline"></ion-icon>
                        </button>
                        <button
                            className={`${estilos.btnVista} ${vistaActual === 'tabla' ? estilos.vistaActiva : ''}`}
                            onClick={() => setVistaActual('tabla')}
                            title="Vista de Tabla"
                            aria-label="Vista de Tabla"
                        >
                            <ion-icon name="list-outline"></ion-icon>
                        </button>
                    </div>
                </div>

                <div className={estilos.chips}>
                    {filtrosChips.map((chip) => (
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

            {/* ================= LISTA DE CLIENTES ================= */}
            {renderizarListaClientes()}

            {/* ================= PAGINACIÓN ================= */}
            {!cargando && clientesFiltrados.length > 0 && totalPaginas > 1 && (
                <Paginacion
                    paginaActual={paginaActual}
                    totalPaginas={totalPaginas}
                    itemsPorPagina={itemsPorPagina}
                    totalItems={clientesFiltrados.length}
                    setPaginaActual={setPaginaActual}
                    tema={tema}
                    estilos={estilos}
                />
            )}
        </div>
    )
}

// ===============================================================
// COMPONENTE: ClienteCard
// ===============================================================
function ClienteCard({ cliente, tema, router, formatearMoneda, obtenerColorBarra, obtenerIconoEstado, estilos }) {
    return (
        <div className={`${estilos.clienteCard} ${estilos[tema]}`}>
            {/* Header */}
            <div className={estilos.cardHeader}>
                <div className={estilos.avatarContenedor}>
                    {cliente.fotoUrl ? (
                        <img
                            src={cliente.fotoUrl}
                            alt={cliente.nombreCompleto}
                            className={estilos.avatar}
                        />
                    ) : (
                        <div className={estilos.avatarPlaceholder}>
                            <ion-icon name="person-outline"></ion-icon>
                        </div>
                    )}
                </div>
                <div className={estilos.infoBasica}>
                    <h3 className={estilos.nombreCliente}>{cliente.nombreCompleto}</h3>
                    <p className={estilos.documentoCliente}>
                        {cliente.tipoDocumentoCodigo}: {cliente.numeroDocumento}
                    </p>
                </div>
                <div className={estilos.badgeEstadoCredito}>
                    <span className={`${estilos.badge} ${estilos[cliente.credito.badgeColor]}`}>
                        <ion-icon name={obtenerIconoEstado(cliente.credito.estadoCredito)}></ion-icon>
                        {cliente.credito.estadoCredito}
                    </span>
                </div>
            </div>

            {/* Body */}
            <div className={estilos.cardBody}>
                <div className={estilos.infoGrid}>
                    <div className={estilos.infoItem}>
                        <ion-icon name="call-outline"></ion-icon>
                        <span>{cliente.telefono || "N/A"}</span>
                    </div>
                    <div className={estilos.infoItem}>
                        <ion-icon name="cash-outline"></ion-icon>
                        <span className={cliente.deuda.tieneDeuda ? estilos.deudaActiva : estilos.sinDeuda}>
                            {cliente.deuda.tieneDeuda ? formatearMoneda(cliente.deuda.total) : "$0.00"}
                        </span>
                    </div>
                    <div className={estilos.infoItem}>
                        <ion-icon name="star-outline"></ion-icon>
                        <span className={estilos.clasificacion}>Clase {cliente.credito.clasificacion}</span>
                    </div>
                    <div className={estilos.infoItem}>
                        <ion-icon name="trending-up-outline"></ion-icon>
                        <span className={estilos.score}>Score: {cliente.credito.score}</span>
                    </div>
                </div>

                {/* Barra de crédito */}
                <div className={estilos.creditoInfo}>
                    <div className={estilos.creditoHeader}>
                        <span className={estilos.creditoLabel}>Uso de Crédito</span>
                        <span className={estilos.creditoPorcentaje}>{cliente.credito.porcentajeUso}%</span>
                    </div>
                    <div className={estilos.creditoBarra}>
                        <div
                            className={estilos.creditoProgreso}
                            style={{
                                width: `${cliente.credito.porcentajeUso}%`,
                                backgroundColor: obtenerColorBarra(cliente.credito.porcentajeUso),
                            }}
                        ></div>
                    </div>
                    <div className={estilos.creditoDetalles}>
                        <span>Utilizado: {formatearMoneda(cliente.credito.utilizado)}</span>
                        <span>Disponible: {formatearMoneda(cliente.credito.disponible)}</span>
                    </div>
                </div>
            </div>

            {/* Footer - Acciones */}
            <div className={estilos.cardFooter}>
                <button
                    onClick={() => router.push(`/admin/clientes/ver/${cliente.id}`)}
                    className={`${estilos.btnAccion} ${estilos.btnVer}`}
                    title="Ver perfil completo"
                >
                    <ion-icon name="eye-outline"></ion-icon>
                    <span>Ver</span>
                </button>
                <button
                    onClick={() => router.push(`/admin/ventas/nueva?cliente=${cliente.id}`)}
                    className={`${estilos.btnAccion} ${estilos.btnVender}`}
                    disabled={!cliente.credito.puedeVender}
                    title={cliente.credito.puedeVender ? "Realizar venta" : "Crédito no disponible"}
                >
                    <ion-icon name="cart-outline"></ion-icon>
                    <span>Vender</span>
                </button>
                <button
                    onClick={() => router.push(`/admin/clientes/ver/${cliente.id}?tab=pagos`)}
                    className={`${estilos.btnAccion} ${estilos.btnCobrar}`}
                    disabled={!cliente.deuda.tieneDeuda}
                    title={cliente.deuda.tieneDeuda ? "Registrar pago" : "Sin deudas pendientes"}
                >
                    <ion-icon name="wallet-outline"></ion-icon>
                    <span>Cobrar</span>
                </button>
                <button
                    onClick={() => router.push(`/admin/clientes/editar/${cliente.id}`)}
                    className={`${estilos.btnAccion} ${estilos.btnEditar}`}
                    title="Editar cliente"
                >
                    <ion-icon name="create-outline"></ion-icon>
                    <span>Editar</span>
                </button>
            </div>
        </div>
    )
}

// ===============================================================
// COMPONENTE: TablaClientes
// ===============================================================
function TablaClientes({ clientesPaginados, tema, router, formatearMoneda, obtenerColorBarra, estilos }) {
    return (
        <div className={estilos.tablaContenedor}>
            <table className={estilos.tabla}>
                <thead>
                    <tr className={estilos[tema]}>
                        <th>Cliente</th>
                        <th>Documento</th>
                        <th>Contacto</th>
                        <th>Deuda</th>
                        <th>Uso Crédito</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {clientesPaginados.map((cliente) => (
                        <tr key={cliente.id} className={`${estilos.filaTabla} ${estilos[tema]}`}>
                            <td className={estilos.tdInfoPrincipal}>
                                <div className={estilos.avatarTabla}>
                                    {cliente.fotoUrl ? (
                                        <img src={cliente.fotoUrl} alt="" />
                                    ) : (
                                        <ion-icon name="person-outline"></ion-icon>
                                    )}
                                </div>
                                <div className={estilos.nombreYCelular}>
                                    <strong>{cliente.nombreCompleto}</strong>
                                    <span className={estilos.celularTabla}>
                                        {cliente.telefono || 'Sin teléfono'}
                                    </span>
                                </div>
                            </td>
                            <td>
                                <div className={estilos.infoDocTabla}>
                                    <span className={estilos.docTipo}>{cliente.tipoDocumentoCodigo}</span>
                                    <span className={estilos.docNum}>{cliente.numeroDocumento}</span>
                                </div>
                            </td>
                            <td>
                                <div className={estilos.infoContactoTabla}>
                                    <span>{cliente.email || 'Sin email'}</span>
                                    <small>{cliente.direccion || 'Sin dirección'}</small>
                                </div>
                            </td>
                            <td>
                                <span className={cliente.deuda.tieneDeuda ? estilos.deudaTablaActiva : estilos.deudaTablaSin}>
                                    {formatearMoneda(cliente.deuda.total)}
                                </span>
                            </td>
                            <td>
                                <div className={estilos.usoCreditoTabla}>
                                    <div className={estilos.barraMini}>
                                        <div
                                            className={estilos.progresoMini}
                                            style={{
                                                width: `${cliente.credito.porcentajeUso}%`,
                                                backgroundColor: obtenerColorBarra(cliente.credito.porcentajeUso)
                                            }}
                                        ></div>
                                    </div>
                                    <span>{cliente.credito.porcentajeUso}%</span>
                                </div>
                            </td>
                            <td>
                                <span className={`${estilos.badgeTabla} ${estilos[cliente.credito.badgeColor]}`}>
                                    {cliente.credito.estadoCredito}
                                </span>
                            </td>
                            <td>
                                <div className={estilos.accionesTabla}>
                                    <button
                                        onClick={() => router.push(`/admin/clientes/ver/${cliente.id}`)}
                                        className={estilos.btnTablaVer}
                                        title="Ver Perfil"
                                        aria-label="Ver Perfil"
                                    >
                                        <ion-icon name="eye-outline"></ion-icon>
                                    </button>
                                    <button
                                        onClick={() => router.push(`/admin/ventas/nueva?cliente=${cliente.id}`)}
                                        className={estilos.btnTablaVender}
                                        disabled={!cliente.credito.puedeVender}
                                        title="Venta Crédito"
                                        aria-label="Realizar Venta"
                                    >
                                        <ion-icon name="cart-outline"></ion-icon>
                                    </button>
                                    <button
                                        onClick={() => router.push(`/admin/clientes/editar/${cliente.id}`)}
                                        className={estilos.btnTablaEditar}
                                        title="Editar"
                                        aria-label="Editar Cliente"
                                    >
                                        <ion-icon name="create-outline"></ion-icon>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

// ===============================================================
// COMPONENTE: Paginación
// ===============================================================
function Paginacion({ paginaActual, totalPaginas, itemsPorPagina, totalItems, setPaginaActual, tema, estilos }) {
    const inicioItem = (paginaActual - 1) * itemsPorPagina + 1
    const finItem = Math.min(paginaActual * itemsPorPagina, totalItems)

    // Generar números de página visibles
    const obtenerNumerosPagina = () => {
        const numeros = []

        if (totalPaginas <= 7) {
            // Mostrar todas las páginas si son 7 o menos
            for (let i = 1; i <= totalPaginas; i++) {
                numeros.push(i)
            }
        } else {
            // Lógica inteligente para páginas múltiples
            numeros.push(1)

            if (paginaActual > 3) {
                numeros.push('...')
            }

            for (let i = Math.max(2, paginaActual - 1); i <= Math.min(paginaActual + 1, totalPaginas - 1); i++) {
                numeros.push(i)
            }

            if (paginaActual < totalPaginas - 2) {
                numeros.push('...')
            }

            numeros.push(totalPaginas)
        }

        return numeros
    }

    const numerosPagina = obtenerNumerosPagina()

    return (
        <div className={`${estilos.paginacion} ${estilos[tema]}`}>
            <div className={estilos.paginacionInfo}>
                <span>
                    Mostrando {inicioItem}-{finItem} de {totalItems} clientes
                </span>
            </div>
            <div className={estilos.paginacionControles}>
                <button
                    className={estilos.btnPaginacion}
                    onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                    disabled={paginaActual === 1}
                    aria-label="Página anterior"
                >
                    <ion-icon name="chevron-back-outline"></ion-icon>
                </button>

                <div className={estilos.numerosPagina}>
                    {numerosPagina.map((num, index) => (
                        num === '...' ? (
                            <span key={`ellipsis-${index}`} className={estilos.puntos}>...</span>
                        ) : (
                            <button
                                key={num}
                                className={`${estilos.btnNumeroPagina} ${paginaActual === num ? estilos.activa : ''}`}
                                onClick={() => setPaginaActual(num)}
                                aria-label={`Ir a página ${num}`}
                                aria-current={paginaActual === num ? 'page' : undefined}
                            >
                                {num}
                            </button>
                        )
                    ))}
                </div>

                <button
                    className={estilos.btnPaginacion}
                    onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                    disabled={paginaActual === totalPaginas}
                    aria-label="Página siguiente"
                >
                    <ion-icon name="chevron-forward-outline"></ion-icon>
                </button>
            </div>
        </div>
    )
}