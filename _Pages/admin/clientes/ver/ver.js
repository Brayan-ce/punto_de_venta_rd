"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { obtenerClientePorId } from "./servidor"
import ModalPagos from "../Cobrar/ModalPagos"
import estilos from "./ver.module.css"

export default function VerClienteAdmin() {
    const router = useRouter()
    const params = useParams()
    const searchParams = useSearchParams()
    const [tema, setTema] = useState("light")
    const [cargando, setCargando] = useState(true)
    const [cliente, setCliente] = useState(null)
    const [mostrarMenu, setMostrarMenu] = useState(false)
    const [mostrarModalPagos, setMostrarModalPagos] = useState(false)

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

    useEffect(() => {
        if (params.id) {
            cargarDatos()
        }
    }, [params.id])

    useEffect(() => {
        const tab = searchParams.get('tab')
        if (tab === 'pagos' && cliente) {
            setMostrarModalPagos(true)
        }
    }, [searchParams, cliente])

    const cargarDatos = async () => {
        setCargando(true)
        try {
            const resultado = await obtenerClientePorId(params.id)
            if (resultado.success && resultado.cliente) {
                setCliente(resultado.cliente)
            } else {
                alert(resultado.mensaje || "No se pudo cargar el cliente")
                router.push("/admin/clientes")
            }
        } catch (error) {
            console.error("Error al cargar cliente:", error)
            alert("Error al cargar cliente")
            router.push("/admin/clientes")
        } finally {
            setCargando(false)
        }
    }

    const manejarCerrarModalPagos = (huboCambios) => {
        setMostrarModalPagos(false)
        router.replace(`/admin/clientes/ver/${params.id}`)
        if (huboCambios) {
            cargarDatos()
        }
    }

    const formatearMoneda = (valor) =>
        new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(valor || 0)

    const calcularPorcentajeCredito = () => {
        if (!cliente?.credito?.limite) return 0
        return Math.round((cliente.credito.utilizado / cliente.credito.limite) * 100)
    }

    const obtenerColorCredito = () => {
        const porcentaje = calcularPorcentajeCredito()
        if (porcentaje >= 90) return '#ef4444'
        if (porcentaje >= 70) return '#f59e0b'
        return '#10b981'
    }

    const puedeVender = () => {
        return cliente?.clienteActivo && cliente?.credito?.disponible > 0
    }

    const tieneDeuda = () => {
        return cliente?.credito?.utilizado > 0
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <div className={estilos.loaderSpinner}></div>
                    <span>Cargando perfil del cliente...</span>
                </div>
            </div>
        )
    }

    if (!cliente) return null

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>

            <div className={estilos.header}>
                <button
                    className={estilos.btnVolver}
                    onClick={() => router.push('/admin/clientes')}
                >
                    <ion-icon name="arrow-back-outline"></ion-icon>
                </button>
                <div className={estilos.headerInfo}>
                    <h1>Perfil del Cliente</h1>
                    <p>{cliente.nombreCompleto}</p>
                </div>
                <div className={estilos.headerAcciones}>
                    <button
                        className={estilos.btnHeaderAccion}
                        onClick={() => setMostrarMenu(!mostrarMenu)}
                    >
                        <ion-icon name="ellipsis-horizontal"></ion-icon>
                    </button>
                </div>
            </div>

            <div className={estilos.layoutPrincipal}>

                <div className={estilos.columnaIzquierda}>

                    <div className={estilos.cardPerfil}>
                        <div className={estilos.perfilHeader}>
                            <div className={estilos.avatarContenedor}>
                                {cliente.fotoUrl ? (
                                    <img src={cliente.fotoUrl} alt={cliente.nombreCompleto} />
                                ) : (
                                    <div className={estilos.avatarPlaceholder}>
                                        <ion-icon name="person-outline"></ion-icon>
                                    </div>
                                )}
                                <div className={`${estilos.estadoPunto} ${cliente.clienteActivo ? estilos.activo : estilos.inactivo}`}></div>
                            </div>
                            <div className={estilos.perfilNombre}>
                                <h2>{cliente.nombreCompleto}</h2>
                                <p className={estilos.documento}>
                                    {cliente.documento.tipoCodigo}: {cliente.documento.numero}
                                </p>
                                <span className={`${estilos.badge} ${cliente.clienteActivo ? estilos.badgeActivo : estilos.badgeInactivo}`}>
                                    {cliente.clienteActivo ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                        </div>

                        <div className={estilos.statsGrid}>
                            <div className={estilos.statItem}>
                                <div className={estilos.statIcono}>
                                    <ion-icon name="cart-outline"></ion-icon>
                                </div>
                                <div className={estilos.statInfo}>
                                    <span className={estilos.statLabel}>Compras Totales</span>
                                    <span className={estilos.statValor}>{formatearMoneda(cliente.totalCompras)}</span>
                                </div>
                            </div>
                            <div className={estilos.statItem}>
                                <div className={estilos.statIcono}>
                                    <ion-icon name="star-outline"></ion-icon>
                                </div>
                                <div className={estilos.statInfo}>
                                    <span className={estilos.statLabel}>Puntos</span>
                                    <span className={estilos.statValor}>{cliente.puntosFidelidad || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={estilos.cardContacto}>
                        <h3 className={estilos.cardTitulo}>
                            <ion-icon name="call-outline"></ion-icon>
                            Contacto
                        </h3>
                        <div className={estilos.contactoLista}>
                            {cliente.contacto?.telefono && (
                                <a href={`tel:${cliente.contacto.telefono}`} className={estilos.contactoItem}>
                                    <ion-icon name="call"></ion-icon>
                                    <span>{cliente.contacto.telefono}</span>
                                </a>
                            )}
                            {cliente.contacto?.email && (
                                <a href={`mailto:${cliente.contacto.email}`} className={estilos.contactoItem}>
                                    <ion-icon name="mail"></ion-icon>
                                    <span>{cliente.contacto.email}</span>
                                </a>
                            )}
                            {cliente.contacto?.direccion && (
                                <div className={estilos.contactoItem}>
                                    <ion-icon name="location"></ion-icon>
                                    <span>{cliente.contacto.direccion}</span>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                <div className={estilos.columnaDerecha}>

                    {cliente.credito?.tienePerfil ? (
                        <div className={estilos.tarjetaCreditoContenedor}>
                            <div className={estilos.tarjetaCredito} style={{
                                background: `linear-gradient(135deg, ${obtenerColorCredito()}, ${obtenerColorCredito()}dd)`
                            }}>
                                <div className={estilos.tarjetaHeader}>
                                    <ion-icon name="card-outline"></ion-icon>
                                    <span>Perfil Crediticio</span>
                                    <ion-icon name="wifi" className={estilos.iconoChip}></ion-icon>
                                </div>

                                <div className={estilos.tarjetaMonto}>
                                    <span className={estilos.tarjetaLabel}>Disponible</span>
                                    <span className={estilos.tarjetaDisponible}>
                                        {formatearMoneda(cliente.credito.disponible)}
                                    </span>
                                </div>

                                <div className={estilos.tarjetaProgreso}>
                                    <div className={estilos.progresoInfo}>
                                        <span>{calcularPorcentajeCredito()}% usado</span>
                                        <span>{formatearMoneda(cliente.credito.utilizado)} / {formatearMoneda(cliente.credito.limite)}</span>
                                    </div>
                                    <div className={estilos.barraProgreso}>
                                        <div
                                            className={estilos.barraFill}
                                            style={{ width: `${calcularPorcentajeCredito()}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className={estilos.tarjetaFooter}>
                                    <div className={estilos.tarjetaDato}>
                                        <span>Score</span>
                                        <strong>{cliente.credito.score || 100}</strong>
                                    </div>
                                    <div className={estilos.tarjetaDato}>
                                        <span>Nivel</span>
                                        <strong>{cliente.credito.clasificacion || 'A'}</strong>
                                    </div>
                                    <div className={estilos.tarjetaDato}>
                                        <span>Plazo</span>
                                        <strong>{cliente.credito.diasPlazo || 30}d</strong>
                                    </div>
                                    <div className={estilos.tarjetaDato}>
                                        <span>Frecuencia</span>
                                        <strong style={{ textTransform: 'capitalize' }}>
                                            {cliente.credito.frecuenciaPago || 'Mensual'}
                                        </strong>
                                    </div>
                                </div>
                            </div>

                            <div className={estilos.accionesPrincipales}>
                                <button
                                    className={`${estilos.btnAccion} ${estilos.btnVender}`}
                                    disabled={!puedeVender()}
                                    onClick={() => router.push(`/admin/ventas/nueva?cliente=${cliente.id}`)}
                                >
                                    <div className={estilos.btnIcono}>
                                        <ion-icon name="cart-outline"></ion-icon>
                                    </div>
                                    <div className={estilos.btnTexto}>
                                        <span className={estilos.btnLabel}>Vender</span>
                                        <span className={estilos.btnSubLabel}>
                                            {puedeVender() ? 'Nueva venta' : 'Sin crédito'}
                                        </span>
                                    </div>
                                </button>

                                <button
                                    className={`${estilos.btnAccion} ${estilos.btnCobrar}`}
                                    disabled={!tieneDeuda()}
                                    onClick={() => setMostrarModalPagos(true)}
                                >
                                    <div className={estilos.btnIcono}>
                                        <ion-icon name="wallet-outline"></ion-icon>
                                    </div>
                                    <div className={estilos.btnTexto}>
                                        <span className={estilos.btnLabel}>Cobrar</span>
                                        <span className={estilos.btnSubLabel}>
                                            {tieneDeuda() ? formatearMoneda(cliente.credito.utilizado) : 'Sin deuda'}
                                        </span>
                                    </div>
                                </button>

                                <button
                                    className={`${estilos.btnAccion} ${estilos.btnEditar}`}
                                    onClick={() => router.push(`/admin/clientes/editar/${cliente.id}`)}
                                >
                                    <div className={estilos.btnIcono}>
                                        <ion-icon name="create-outline"></ion-icon>
                                    </div>
                                    <div className={estilos.btnTexto}>
                                        <span className={estilos.btnLabel}>Editar</span>
                                        <span className={estilos.btnSubLabel}>Modificar perfil</span>
                                    </div>
                                </button>
                            </div>

                            <div className={`${estilos.alertaEstado} ${puedeVender() ? estilos.alertaOk : estilos.alertaError}`}>
                                <ion-icon name={puedeVender() ? "checkmark-circle" : "alert-circle"}></ion-icon>
                                <span>
                                    {puedeVender()
                                        ? `Puede vender hasta ${formatearMoneda(cliente.credito.disponible)} a crédito`
                                        : 'Límite de crédito alcanzado. Requiere pago para nuevas ventas'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className={estilos.sinCredito}>
                            <ion-icon name="card-outline"></ion-icon>
                            <h3>Sin Perfil Crediticio</h3>
                            <p>Este cliente no tiene configurado un perfil de crédito.</p>
                            <button
                                className={estilos.btnCrearCredito}
                                onClick={() => router.push(`/admin/clientes/editar/${cliente.id}?tab=credito`)}
                            >
                                <ion-icon name="add-circle-outline"></ion-icon>
                                Configurar Crédito
                            </button>
                        </div>
                    )}

                    <div className={estilos.cardInfo}>
                        <h3 className={estilos.cardTitulo}>
                            <ion-icon name="information-circle-outline"></ion-icon>
                            Información General
                        </h3>
                        <div className={estilos.infoGrid}>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>Fecha de Nacimiento</span>
                                <span className={estilos.infoValor}>
                                    {cliente.datosPersonales?.fechaNacimiento || 'No registrado'}
                                </span>
                            </div>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>Género</span>
                                <span className={estilos.infoValor}>
                                    {cliente.datosPersonales?.genero || 'No especificado'}
                                </span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {mostrarModalPagos && (
                <ModalPagos
                    cliente={cliente}
                    alCerrar={manejarCerrarModalPagos}
                    tema={tema}
                />
            )}
        </div>
    )
}