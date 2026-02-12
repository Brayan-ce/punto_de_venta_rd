"use client"
import {useEffect, useState} from 'react'
import {useRouter} from 'next/navigation'
import {
    obtenerCajaActiva,
    obtenerCajasDisponibles,
    abrirCaja,
    obtenerVentasCaja,
    registrarGasto,
    cerrarCaja,
    obtenerHistorialCajas,
    obtenerTodasLasCajas
} from './servidor'
import estilos from './caja.module.css'

export default function CajaPageAdmin() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [userTipo, setUserTipo] = useState('')

    const [cajaActiva, setCajaActiva] = useState(null)
    const [cajasDisponibles, setCajasDisponibles] = useState([])
    const [ventasCaja, setVentasCaja] = useState([])
    const [todasLasCajas, setTodasLasCajas] = useState([])
    const [historial, setHistorial] = useState([])

    const [vistaActual, setVistaActual] = useState('dashboard')
    const [mostrarModalAbrir, setMostrarModalAbrir] = useState(false)
    const [mostrarModalGasto, setMostrarModalGasto] = useState(false)
    const [mostrarModalCerrar, setMostrarModalCerrar] = useState(false)
        const [mostrarAlertaCajaVieja, setMostrarAlertaCajaVieja] = useState(false)

    const [formAbrir, setFormAbrir] = useState({
        numero_caja: '',
        monto_inicial: ''
    })

    const [formGasto, setFormGasto] = useState({
        concepto: '',
        monto: '',
        categoria: '',
        comprobante_numero: '',
        notas: ''
    })

    const [formCerrar, setFormCerrar] = useState({
        monto_final: '',
        notas: ''
    })

    useEffect(() => {
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)
        const tipo = localStorage.getItem('userTipo') || ''
        setUserTipo(tipo)

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
    }, [vistaActual])

    const cargarDatos = async () => {
        setCargando(true)
        try {
            if (vistaActual === 'dashboard') {
                const [resultadoCaja, resultadoVentas, resultadoDisponibles] = await Promise.all([
                    obtenerCajaActiva(),
                    obtenerVentasCaja(),
                    obtenerCajasDisponibles()
                ])

                if (resultadoCaja.success && resultadoCaja.caja) {
                    setCajaActiva(resultadoCaja.caja)
                } else {
                    setCajaActiva(null)
                }

                if (resultadoVentas.success) {
                    setVentasCaja(resultadoVentas.ventas)
                }

                if (resultadoDisponibles.success) {
                    setCajasDisponibles(resultadoDisponibles.cajas)
                }
            } else if (vistaActual === 'historial') {
                const resultado = await obtenerHistorialCajas()
                if (resultado.success) {
                    setHistorial(resultado.cajas)
                }
            } else if (vistaActual === 'todas' && userTipo === 'admin') {
                const resultado = await obtenerTodasLasCajas()
                if (resultado.success) {
                    setTodasLasCajas(resultado.cajas)
                }
            }
        } catch (error) {
            console.error('Error al cargar datos:', error)
        } finally {
            setCargando(false)
        }
    }
useEffect(() => {
    if (cajaActiva && cajaActiva.fecha_caja) {
        // Convertir ambas fechas a formato YYYY-MM-DD para comparar solo el día
        const fechaCaja = new Date(cajaActiva.fecha_caja).toISOString().split('T')[0]
        const fechaHoy = new Date().toISOString().split('T')[0]
        
        if (fechaCaja !== fechaHoy) {
            setMostrarAlertaCajaVieja(true)
        }
    }
}, [cajaActiva])
useEffect(() => {
    console.log('🔍 DEBUG ALERTA:', {
        tieneCajaActiva: !!cajaActiva,
        fechaCaja: cajaActiva?.fecha_caja,
        fechaCajaISO: cajaActiva?.fecha_caja ? new Date(cajaActiva.fecha_caja).toISOString().split('T')[0] : null,
        fechaHoyISO: new Date().toISOString().split('T')[0],
        sonIguales: cajaActiva?.fecha_caja ? (new Date(cajaActiva.fecha_caja).toISOString().split('T')[0] === new Date().toISOString().split('T')[0]) : null,
        mostrarAlerta: mostrarAlertaCajaVieja
    })
}, [cajaActiva, mostrarAlertaCajaVieja])

    const abrirModalAbrir = () => {
        setFormAbrir({
            numero_caja: cajasDisponibles.length > 0 ? cajasDisponibles[0].numero : '',
            monto_inicial: ''
        })
        setMostrarModalAbrir(true)
    }

    const manejarAbrirCaja = async (e) => {
        e.preventDefault()

        if (!formAbrir.numero_caja || !formAbrir.monto_inicial) {
            alert('Completa todos los campos obligatorios')
            return
        }

        if (parseFloat(formAbrir.monto_inicial) < 0) {
            alert('El monto inicial debe ser mayor o igual a cero')
            return
        }

        setProcesando(true)
        try {
            const resultado = await abrirCaja({
                numero_caja: parseInt(formAbrir.numero_caja),
                monto_inicial: parseFloat(formAbrir.monto_inicial)
            })

            if (resultado.success) {
                alert(resultado.mensaje)
                setMostrarModalAbrir(false)
                await cargarDatos()
            } else {
                alert(resultado.mensaje)
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error al abrir caja')
        } finally {
            setProcesando(false)
        }
    }

    const abrirModalGasto = () => {
        setFormGasto({
            concepto: '',
            monto: '',
            categoria: '',
            comprobante_numero: '',
            notas: ''
        })
        setMostrarModalGasto(true)
    }

    const manejarRegistrarGasto = async (e) => {
        e.preventDefault()

        if (!formGasto.concepto || !formGasto.monto) {
            alert('Completa los campos obligatorios')
            return
        }

        if (parseFloat(formGasto.monto) <= 0) {
            alert('El monto debe ser mayor a cero')
            return
        }

        setProcesando(true)
        try {
            const resultado = await registrarGasto({
                concepto: formGasto.concepto.trim(),
                monto: parseFloat(formGasto.monto),
                categoria: formGasto.categoria.trim() || null,
                comprobante_numero: formGasto.comprobante_numero.trim() || null,
                notas: formGasto.notas.trim() || null
            })

            if (resultado.success) {
                alert(resultado.mensaje)
                setMostrarModalGasto(false)
                await cargarDatos()
            } else {
                alert(resultado.mensaje)
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error al registrar gasto')
        } finally {
            setProcesando(false)
        }
    }

    const abrirModalCerrar = () => {
        setFormCerrar({
            monto_final: '',
            notas: ''
        })
        setMostrarModalCerrar(true)
    }

    const manejarCerrarCaja = async (e) => {
        e.preventDefault()

        if (!formCerrar.monto_final) {
            alert('Ingresa el monto final de caja')
            return
        }

        if (parseFloat(formCerrar.monto_final) < 0) {
            alert('El monto final debe ser mayor o igual a cero')
            return
        }

        const esperado = parseFloat(cajaActiva.monto_inicial || 0) +
            parseFloat(cajaActiva.total_ventas || 0) -
            parseFloat(cajaActiva.total_gastos || 0)

        const diferencia = parseFloat(formCerrar.monto_final) - esperado

        const confirmar = window.confirm(
            diferencia === 0
                ? '¿Confirmas el cierre de caja? El monto cuadra perfectamente.'
                : `¿Confirmas el cierre de caja? Hay una diferencia de ${formatearMoneda(Math.abs(diferencia))} ${diferencia > 0 ? 'a favor' : 'en contra'}.`
        )

        if (!confirmar) return

        setProcesando(true)
        try {
            const resultado = await cerrarCaja({
                caja_id: cajaActiva.id,
                monto_final: parseFloat(formCerrar.monto_final),
                notas: formCerrar.notas.trim() || null
            })

            if (resultado.success) {
                alert(resultado.mensaje)
                setMostrarModalCerrar(false)
                setCajaActiva(null)
                await cargarDatos()
            } else {
                alert(resultado.mensaje)
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error al cerrar caja')
        } finally {
            setProcesando(false)
        }
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2
        }).format(monto)
    }

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const formatearHora = (fecha) => {
        return new Date(fecha).toLocaleTimeString('es-DO', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando datos...</span>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Caja</h1>
                    <p className={estilos.subtitulo}>Gestiona tus cajas y turnos</p>
                </div>
            </div>

            <div className={estilos.tabs}>
                <button
                    className={`${estilos.tab} ${vistaActual === 'dashboard' ? estilos.tabActiva : ''}`}
                    onClick={() => setVistaActual('dashboard')}
                >
                    <ion-icon name="calculator-outline"></ion-icon>
                    <span>Mi Caja</span>
                </button>
                <button
                    className={`${estilos.tab} ${vistaActual === 'historial' ? estilos.tabActiva : ''}`}
                    onClick={() => setVistaActual('historial')}
                >
                    <ion-icon name="time-outline"></ion-icon>
                    <span>Historial</span>
                </button>
                {userTipo === 'admin' && (
                    <button
                        className={`${estilos.tab} ${vistaActual === 'todas' ? estilos.tabActiva : ''}`}
                        onClick={() => setVistaActual('todas')}
                    >
                        <ion-icon name="grid-outline"></ion-icon>
                        <span>Todas las Cajas</span>
                    </button>
                )}
            </div>

            {vistaActual === 'dashboard' && (
                <>
                    {cajaActiva ? (
                        <>
                            <div className={estilos.cajaActivaHeader}>
                                <div className={`${estilos.cajaActivaBadge} ${estilos[tema]}`}>
                                    <ion-icon name="cash-outline"></ion-icon>
                                    <div>
                                        <span className={estilos.cajaNumero}>Caja {cajaActiva.numero_caja}</span>
                                        <span className={estilos.cajaEstado}>Abierta</span>
                                    </div>
                                </div>
                                <div className={estilos.cajaAcciones}>
                                    <button onClick={abrirModalGasto} className={estilos.btnGasto}>
                                        <ion-icon name="remove-circle-outline"></ion-icon>
                                        <span>Registrar Gasto</span>
                                    </button>
                                    <button onClick={abrirModalCerrar} className={estilos.btnCerrar}>
                                        <ion-icon name="lock-closed-outline"></ion-icon>
                                        <span>Cerrar Caja</span>
                                    </button>
                                </div>
                            </div>

                            <div className={estilos.estadisticasGrid}>
                                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                                    <div className={estilos.estadIcono}>
                                        <ion-icon name="wallet-outline"></ion-icon>
                                    </div>
                                    <div className={estilos.estadInfo}>
                                        <span className={estilos.estadLabel}>Monto Inicial</span>
                                        <span
                                            className={estilos.estadValor}>{formatearMoneda(cajaActiva.monto_inicial)}</span>
                                    </div>
                                </div>

                                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                                    <div className={`${estilos.estadIcono} ${estilos.success}`}>
                                        <ion-icon name="trending-up-outline"></ion-icon>
                                    </div>
                                    <div className={estilos.estadInfo}>
                                        <span className={estilos.estadLabel}>Ventas del Dia</span>
                                        <span
                                            className={estilos.estadValor}>{formatearMoneda(cajaActiva.total_ventas)}</span>
                                    </div>
                                </div>

                                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                                    <div className={`${estilos.estadIcono} ${estilos.danger}`}>
                                        <ion-icon name="arrow-down-outline"></ion-icon>
                                    </div>
                                    <div className={estilos.estadInfo}>
                                        <span className={estilos.estadLabel}>Gastos</span>
                                        <span
                                            className={estilos.estadValor}>{formatearMoneda(cajaActiva.total_gastos)}</span>
                                    </div>
                                </div>

                                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                                    <div className={`${estilos.estadIcono} ${estilos.primary}`}>
                                        <ion-icon name="cash-outline"></ion-icon>
                                    </div>
                                    <div className={estilos.estadInfo}>
                                        <span className={estilos.estadLabel}>Total en Caja</span>
                                        <span className={estilos.estadValor}>
                                            {formatearMoneda(
                                                parseFloat(cajaActiva.monto_inicial || 0) +
                                                parseFloat(cajaActiva.total_ventas || 0) -
                                                parseFloat(cajaActiva.total_gastos || 0)
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className={estilos.detallesGrid}>
                                <div className={`${estilos.panel} ${estilos[tema]}`}>
                                    <h2 className={estilos.panelTitulo}>Desglose por Metodo de Pago</h2>
                                    <div className={estilos.metodosList}>
                                        <div className={estilos.metodoItem}>
                                            <div className={estilos.metodoInfo}>
                                                <ion-icon name="cash-outline"></ion-icon>
                                                <span>Efectivo</span>
                                            </div>
                                            <span
                                                className={estilos.metodoMonto}>{formatearMoneda(cajaActiva.total_efectivo)}</span>
                                        </div>
                                        <div className={estilos.metodoItem}>
                                            <div className={estilos.metodoInfo}>
                                                <ion-icon name="card-outline"></ion-icon>
                                                <span>Tarjeta Debito</span>
                                            </div>
                                            <span
                                                className={estilos.metodoMonto}>{formatearMoneda(cajaActiva.total_tarjeta_debito)}</span>
                                        </div>
                                        <div className={estilos.metodoItem}>
                                            <div className={estilos.metodoInfo}>
                                                <ion-icon name="card-outline"></ion-icon>
                                                <span>Tarjeta Credito</span>
                                            </div>
                                            <span
                                                className={estilos.metodoMonto}>{formatearMoneda(cajaActiva.total_tarjeta_credito)}</span>
                                        </div>
                                        <div className={estilos.metodoItem}>
                                            <div className={estilos.metodoInfo}>
                                                <ion-icon name="sync-outline"></ion-icon>
                                                <span>Transferencia</span>
                                            </div>
                                            <span
                                                className={estilos.metodoMonto}>{formatearMoneda(cajaActiva.total_transferencia)}</span>
                                        </div>
                                        {cajaActiva.total_cheque > 0 && (
                                            <div className={estilos.metodoItem}>
                                                <div className={estilos.metodoInfo}>
                                                    <ion-icon name="document-text-outline"></ion-icon>
                                                    <span>Cheque</span>
                                                </div>
                                                <span
                                                    className={estilos.metodoMonto}>{formatearMoneda(cajaActiva.total_cheque)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className={`${estilos.panel} ${estilos[tema]}`}>
                                    <h2 className={estilos.panelTitulo}>Informacion del Turno</h2>
                                    <div className={estilos.infoGrid}>
                                        <div className={estilos.infoItem}>
                                            <span className={estilos.infoLabel}>Fecha</span>
                                            <span
                                                className={estilos.infoValor}>{formatearFecha(cajaActiva.fecha_apertura)}</span>
                                        </div>
                                        <div className={estilos.infoItem}>
                                            <span className={estilos.infoLabel}>Hora Apertura</span>
                                            <span
                                                className={estilos.infoValor}>{formatearHora(cajaActiva.fecha_apertura)}</span>
                                        </div>
                                        <div className={estilos.infoItem}>
                                            <span className={estilos.infoLabel}>Ventas Realizadas</span>
                                            <span className={estilos.infoValor}>{ventasCaja.length}</span>
                                        </div>
                                        <div className={estilos.infoItem}>
                                            <span className={estilos.infoLabel}>Estado</span>
                                            <span className={`${estilos.badge} ${estilos.activo}`}>Abierta</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {ventasCaja.length > 0 && (
                                <div className={`${estilos.panel} ${estilos[tema]}`}>
                                    <h2 className={estilos.panelTitulo}>Ventas del Turno ({ventasCaja.length})</h2>
                                    <div className={estilos.ventasList}>
                                        {ventasCaja.map((venta) => (
                                            <div key={venta.id} className={`${estilos.ventaItem} ${estilos[tema]}`}>
                                                <div className={estilos.ventaInfo}>
                                                    <span className={estilos.ventaNcf}>{venta.ncf}</span>
                                                    <span
                                                        className={estilos.ventaHora}>{formatearHora(venta.fecha_venta)}</span>
                                                </div>
                                                <div className={estilos.ventaDetalle}>
                                                    <span className={estilos.ventaMetodo}>{venta.metodo_pago}</span>
                                                    <span
                                                        className={estilos.ventaTotal}>{formatearMoneda(venta.total)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className={`${estilos.sinCaja} ${estilos[tema]}`}>
                            <ion-icon name="lock-open-outline"></ion-icon>
                            <h2>No tienes una caja abierta</h2>
                            <p>Abre una caja para comenzar a registrar ventas</p>
                            {cajasDisponibles.length > 0 ? (
                                <button onClick={abrirModalAbrir} className={estilos.btnAbrirCaja}>
                                    <ion-icon name="add-circle-outline"></ion-icon>
                                    <span>Abrir Caja</span>
                                </button>
                            ) : (
                                <p className={estilos.noDisponibles}>No hay cajas disponibles. Todas estan en uso.</p>
                            )}
                        </div>
                    )}
                </>
            )}

            {vistaActual === 'historial' && (
                <div className={`${estilos.panel} ${estilos[tema]}`}>
                    <h2 className={estilos.panelTitulo}>Historial de Cajas</h2>
                    {historial.length === 0 ? (
                        <div className={estilos.vacio}>
                            <ion-icon name="document-outline"></ion-icon>
                            <span>No hay historial de cajas</span>
                        </div>
                    ) : (
                        <div className={estilos.historialList}>
                            {historial.map((caja) => (
                                <div key={caja.id} className={`${estilos.historialItem} ${estilos[tema]}`}>
                                    <div className={estilos.historialHeader}>
                                        <div>
                                            <span className={estilos.historialCaja}>Caja {caja.numero_caja}</span>
                                            <span
                                                className={estilos.historialFecha}>{formatearFecha(caja.fecha_caja)}</span>
                                        </div>
                                        <span
                                            className={`${estilos.badge} ${caja.estado === 'abierta' ? estilos.activo : estilos.inactivo}`}>
                                            {caja.estado}
                                        </span>
                                    </div>
                                    <div className={estilos.historialDetalles}>
                                        <div className={estilos.historialStat}>
                                            <span className={estilos.historialLabel}>Monto Inicial</span>
                                            <span
                                                className={estilos.historialValor}>{formatearMoneda(caja.monto_inicial)}</span>
                                        </div>
                                        <div className={estilos.historialStat}>
                                            <span className={estilos.historialLabel}>Ventas</span>
                                            <span
                                                className={estilos.historialValor}>{formatearMoneda(caja.total_ventas)}</span>
                                        </div>
                                        <div className={estilos.historialStat}>
                                            <span className={estilos.historialLabel}>Gastos</span>
                                            <span
                                                className={estilos.historialValor}>{formatearMoneda(caja.total_gastos)}</span>
                                        </div>
                                        {caja.estado === 'cerrada' && (
                                            <>
                                                <div className={estilos.historialStat}>
                                                    <span className={estilos.historialLabel}>Esperado</span>
                                                    <span className={estilos.historialValor}>
                                                        {formatearMoneda(
                                                            parseFloat(caja.monto_inicial || 0) +
                                                            parseFloat(caja.total_ventas || 0) -
                                                            parseFloat(caja.total_gastos || 0)
                                                        )}
                                                    </span>
                                                </div>
                                                <div className={estilos.historialStat}>
                                                    <span className={estilos.historialLabel}>Real</span>
                                                    <span
                                                        className={estilos.historialValor}>{formatearMoneda(caja.monto_final)}</span>
                                                </div>
                                                <div className={estilos.historialStat}>
                                                    <span className={estilos.historialLabel}>Diferencia</span>
                                                    <span
                                                        className={`${estilos.historialValor} ${parseFloat(caja.diferencia || 0) === 0 ? estilos.success : estilos.danger}`}>
                                                        {formatearMoneda(caja.diferencia)}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {vistaActual === 'todas' && userTipo === 'admin' && (
                <div className={`${estilos.panel} ${estilos[tema]}`}>
                    <h2 className={estilos.panelTitulo}>Todas las Cajas de Hoy</h2>
                    {todasLasCajas.length === 0 ? (
                        <div className={estilos.vacio}>
                            <ion-icon name="folder-open-outline"></ion-icon>
                            <span>No hay cajas abiertas hoy</span>
                        </div>
                    ) : (
                        <div className={estilos.cajasGrid}>
                            {todasLasCajas.map((caja) => (
                                <div key={caja.id} className={`${estilos.cajaCard} ${estilos[tema]}`}>
                                    <div className={estilos.cajaCardHeader}>
                                        <h3>Caja {caja.numero_caja}</h3>
                                        <span
                                            className={`${estilos.badge} ${caja.estado === 'abierta' ? estilos.activo : estilos.inactivo}`}>
                                            {caja.estado}
                                        </span>
                                    </div>
                                    <div className={estilos.cajaCardBody}>
                                        <div className={estilos.cajaCardInfo}>
                                            <ion-icon name="person-outline"></ion-icon>
                                            <span>{caja.usuario_nombre}</span>
                                        </div>
                                        <div className={estilos.cajaCardStats}>
                                            <div className={estilos.cajaCardStat}>
                                                <span className={estilos.cajaCardLabel}>Ventas</span>
                                                <span
                                                    className={estilos.cajaCardValor}>{formatearMoneda(caja.total_ventas)}</span>
                                            </div>
                                            <div className={estilos.cajaCardStat}>
                                                <span className={estilos.cajaCardLabel}>En Caja</span>
                                                <span className={estilos.cajaCardValor}>
                                                    {formatearMoneda(
                                                        parseFloat(caja.monto_inicial || 0) +
                                                        parseFloat(caja.total_ventas || 0) -
                                                        parseFloat(caja.total_gastos || 0)
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {mostrarModalAbrir && (
                <div className={estilos.modal}>
                    <div className={`${estilos.modalContenido} ${estilos[tema]}`}>
                        <div className={estilos.modalHeader}>
                            <h3>Abrir Caja</h3>
                            <button onClick={() => setMostrarModalAbrir(false)} className={estilos.btnCerrarModal}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>
                        <form onSubmit={manejarAbrirCaja}>
                            <div className={estilos.modalBody}>
                                <div className={estilos.grupoInput}>
                                    <label>Número de Caja Disponible *</label>
                                    <select
                                        value={formAbrir.numero_caja}
                                        onChange={(e) => setFormAbrir({...formAbrir, numero_caja: e.target.value})}
                                        required
                                        disabled={procesando}
                                    >
                                        <option value="">Seleccionar caja</option>
                                        {cajasDisponibles.map((caja) => (
                                            <option key={caja.numero} value={caja.numero}>
                                                Caja {caja.numero}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className={estilos.grupoInput}>
                                    <label>Monto Inicial *</label>
                                    <input
                                        type="number"
                                        value={formAbrir.monto_inicial}
                                        onChange={(e) => setFormAbrir({...formAbrir, monto_inicial: e.target.value})}
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                        required
                                        disabled={procesando}
                                    />
                                </div>
                            </div>
                            <div className={estilos.modalFooter}>
                                <button type="button" onClick={() => setMostrarModalAbrir(false)}
                                        className={estilos.btnCancelar}>
                                    Cancelar
                                </button>
                                <button type="submit" className={estilos.btnGuardar} disabled={procesando}>
                                    <ion-icon name="checkmark-outline"></ion-icon>
                                    <span>{procesando ? 'Abriendo...' : 'Abrir Caja'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {mostrarModalGasto && (
                <div className={estilos.modal}>
                    <div className={`${estilos.modalContenido} ${estilos[tema]}`}>
                        <div className={estilos.modalHeader}>
                            <h3>Registrar Gasto</h3>
                            <button onClick={() => setMostrarModalGasto(false)} className={estilos.btnCerrarModal}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>
                        <form onSubmit={manejarRegistrarGasto}>
                            <div className={estilos.modalBody}>
                                <div className={estilos.grupoInput}>
                                    <label>Concepto *</label>
                                    <input
                                        type="text"
                                        value={formGasto.concepto}
                                        onChange={(e) => setFormGasto({...formGasto, concepto: e.target.value})}
                                        placeholder="Ej: Compra de insumos"
                                        required
                                        disabled={procesando}
                                    />
                                </div>
                                <div className={estilos.grupoInput}>
                                    <label>Monto *</label>
                                    <input
                                        type="number"
                                        value={formGasto.monto}
                                        onChange={(e) => setFormGasto({...formGasto, monto: e.target.value})}
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0.01"
                                        required
                                        disabled={procesando}
                                    />
                                </div>
                                <div className={estilos.grupoInput}>
                                    <label>Categoria</label>
                                    <input
                                        type="text"
                                        value={formGasto.categoria}
                                        onChange={(e) => setFormGasto({...formGasto, categoria: e.target.value})}
                                        placeholder="Ej: Operativo"
                                        disabled={procesando}
                                    />
                                </div>
                                <div className={estilos.grupoInput}>
                                    <label>Numero de Comprobante</label>
                                    <input
                                        type="text"
                                        value={formGasto.comprobante_numero}
                                        onChange={(e) => setFormGasto({
                                            ...formGasto,
                                            comprobante_numero: e.target.value
                                        })}
                                        placeholder="Ej: FAC-001"
                                        disabled={procesando}
                                    />
                                </div>
                                <div className={estilos.grupoInput}>
                                    <label>Notas</label>
                                    <textarea
                                        value={formGasto.notas}
                                        onChange={(e) => setFormGasto({...formGasto, notas: e.target.value})}
                                        placeholder="Detalles adicionales..."
                                        rows="3"
                                        disabled={procesando}
                                    />
                                </div>
                            </div>
                            <div className={estilos.modalFooter}>
                                <button type="button" onClick={() => setMostrarModalGasto(false)}
                                        className={estilos.btnCancelar}>
                                    Cancelar
                                </button>
                                <button type="submit" className={estilos.btnGuardar} disabled={procesando}>
                                    <ion-icon name="checkmark-outline"></ion-icon>
                                    <span>{procesando ? 'Guardando...' : 'Registrar Gasto'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {mostrarModalCerrar && (
                <div className={estilos.modal}>
                    <div className={`${estilos.modalContenido} ${estilos[tema]}`}>
                        <div className={estilos.modalHeader}>
                            <h3>Cerrar Caja</h3>
                            <button onClick={() => setMostrarModalCerrar(false)} className={estilos.btnCerrarModal}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>
                        <form onSubmit={manejarCerrarCaja}>
                            <div className={estilos.modalBody}>
                                <div className={estilos.alertaInfo}>
                                    <ion-icon name="information-circle-outline"></ion-icon>
                                    <span>Cuenta el dinero fisico en caja e ingresa el monto total</span>
                                </div>
                                <div className={estilos.resumenCierre}>
                                    <div className={estilos.resumenItem}>
                                        <span>Monto Inicial:</span>
                                        <span>{formatearMoneda(cajaActiva.monto_inicial)}</span>
                                    </div>
                                    <div className={estilos.resumenItem}>
                                        <span>Ventas:</span>
                                        <span>{formatearMoneda(cajaActiva.total_ventas)}</span>
                                    </div>
                                    <div className={estilos.resumenItem}>
                                        <span>Gastos:</span>
                                        <span>-{formatearMoneda(cajaActiva.total_gastos)}</span>
                                    </div>
                                    <div className={`${estilos.resumenItem} ${estilos.total}`}>
                                        <span>Esperado en Caja:</span>
                                        <span>{formatearMoneda(
                                            parseFloat(cajaActiva.monto_inicial || 0) +
                                            parseFloat(cajaActiva.total_ventas || 0) -
                                            parseFloat(cajaActiva.total_gastos || 0)
                                        )}</span>
                                    </div>
                                </div>
                                <div className={estilos.grupoInput}>
                                    <label>Monto Final en Caja *</label>
                                    <input
                                        type="number"
                                        value={formCerrar.monto_final}
                                        onChange={(e) => setFormCerrar({...formCerrar, monto_final: e.target.value})}
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                        required
                                        disabled={procesando}
                                    />
                                </div>
                                {formCerrar.monto_final && (
                                    <div className={estilos.diferenciaInfo}>
                                        <span>Diferencia:</span>
                                        <span className={
                                            (parseFloat(formCerrar.monto_final) - (
                                                parseFloat(cajaActiva.monto_inicial || 0) +
                                                parseFloat(cajaActiva.total_ventas || 0) -
                                                parseFloat(cajaActiva.total_gastos || 0)
                                            )) === 0
                                                ? estilos.success
                                                : estilos.danger
                                        }>
                                            {formatearMoneda(
                                                parseFloat(formCerrar.monto_final) - (
                                                    parseFloat(cajaActiva.monto_inicial || 0) +
                                                    parseFloat(cajaActiva.total_ventas || 0) -
                                                    parseFloat(cajaActiva.total_gastos || 0)
                                                )
                                            )}
                                        </span>
                                    </div>
                                )}
                                <div className={estilos.grupoInput}>
                                    <label>Notas</label>
                                    <textarea
                                        value={formCerrar.notas}
                                        onChange={(e) => setFormCerrar({...formCerrar, notas: e.target.value})}
                                        placeholder="Observaciones del cierre..."
                                        rows="3"
                                        disabled={procesando}
                                    />
                                </div>
                            </div>
                            <div className={estilos.modalFooter}>
                                <button type="button" onClick={() => setMostrarModalCerrar(false)}
                                        className={estilos.btnCancelar}>
                                    Cancelar
                                </button>
                                <button type="submit" className={estilos.btnGuardar} disabled={procesando}>
                                    <ion-icon name="lock-closed-outline"></ion-icon>
                                    <span>{procesando ? 'Cerrando...' : 'Cerrar Caja'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            
{mostrarAlertaCajaVieja && cajaActiva && (
    <div className={estilos.modalAlerta}>
        <div className={estilos.alertaContenido}>
            <div className={estilos.alertaBarra} />
            
            <div className={estilos.alertaTexto}>
                <div className={estilos.alertaIcono}>
    <ion-icon name="warning-outline"></ion-icon>
</div>
                
                <h2 className={estilos.alertaTitulo}>Caja de Día Anterior</h2>
                
                <p className={estilos.alertaDescripcion}>
                    Tu Caja {cajaActiva.numero_caja} fue abierta el
                    <strong className={estilos.alertaFecha}>
                        {formatearFecha(cajaActiva.fecha_caja)}
                    </strong>
                </p>
                
                <div className={estilos.alertaCuadro}>
                    <p>
                        Para registrar gastos y ventas correctamente, debes cerrar esta caja 
                        y abrir una nueva para el día de hoy.
                    </p>
                </div>
                
                <button
                    onClick={() => setMostrarAlertaCajaVieja(false)}
                    className={estilos.btnAlertaCerrar}
                >
                    Entendido
                </button>
            </div>
        </div>
    </div>
)}
        </div>
    )
}