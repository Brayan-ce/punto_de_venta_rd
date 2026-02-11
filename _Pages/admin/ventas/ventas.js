"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { obtenerDatosCaja, abrirCaja, cerrarCaja, obtenerVentas, anularVenta } from './servidor'
import estilos from './ventas.module.css'
import Swal from 'sweetalert2' // Para alertas bonitas

export default function VentasAdmin() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(false)
    const [cajaAbierta, setCajaAbierta] = useState(false)
    const [datosCaja, setDatosCaja] = useState(null)

    // Modales y formularios
    const [mostrarModalCaja, setMostrarModalCaja] = useState(false) // Para abrir
    const [mostrarModalCierre, setMostrarModalCierre] = useState(false) // Para cerrar

    const [montoInicial, setMontoInicial] = useState('')
    const [montoFinal, setMontoFinal] = useState('') // Efectivo en caja al cierre

    const [procesando, setProcesando] = useState(false)

    // 📊 Datos de ventas
    const [ventas, setVentas] = useState([])
    const [resumen, setResumen] = useState({
        totalVentas: 0,
        cantidadEmitidas: 0,
        cantidadAnuladas: 0,
        cantidadPendientes: 0
    })

    // ... (States de filtros quedan igual)
    // 🎯 Filtros principales
    const [periodo, setPeriodo] = useState('hoy') // 'hoy', 'semana', 'mes', 'personalizado'
    const [soloCajaAbierta, setSoloCajaAbierta] = useState(false)
    const [busqueda, setBusqueda] = useState('')

    // 🎯 Filtros avanzados (Bottom Sheet en móvil)
    const [mostrarFiltros, setMostrarFiltros] = useState(false)
    const [filtrosAvanzados, setFiltrosAvanzados] = useState({
        vendedorId: '',
        clienteId: '',
        // tipo: '',
        estado: '', // 'emitida', 'anulada', 'pendiente'
        metodo: '', // 'efectivo', 'tarjeta_debito', etc.
        minTotal: '',
        maxTotal: ''
    })

    // 📅 Rango personalizado
    const [fechaInicio, setFechaInicio] = useState('')
    const [fechaFin, setFechaFin] = useState('')

    // 📄 Paginación
    const [paginaActual, setPaginaActual] = useState(1)
    const [totalPaginas, setTotalPaginas] = useState(1)
    const [totalVentas, setTotalVentas] = useState(0)
    const [limite] = useState(20) // Fijo en 20 por página

    // 📱 Detección de móvil
    const [vistaMovil, setVistaMovil] = useState(false)

    // ============================================
    // 🎨 EFECTOS INICIALES
    // ============================================

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
        const checkVistaMovil = () => {
            setVistaMovil(window.innerWidth <= 1024)
        }

        checkVistaMovil()
        window.addEventListener('resize', checkVistaMovil)

        return () => window.removeEventListener('resize', checkVistaMovil)
    }, [])

    useEffect(() => {
        verificarCaja()
        cargarVentas() // 🔹 NUEVO: Cargar ventas aunque no haya caja abierta
    }, [])

    // ============================================
    // 🔄 RECARGAR CUANDO CAMBIAN LOS FILTROS
    // ============================================

    useEffect(() => {
        setPaginaActual(1) // Reset a primera página
        cargarVentas()
    }, [periodo, soloCajaAbierta, filtrosAvanzados, fechaInicio, fechaFin])

    // ============================================
    // 🎯 FUNCIONES PRINCIPALES
    // ============================================

    const verificarCaja = async () => {
        try {
            const resultado = await obtenerDatosCaja()
            if (resultado.success) {
                if (resultado.cajaAbierta) {
                    setCajaAbierta(true)
                    setDatosCaja(resultado.caja)
                } else {
                    setCajaAbierta(false)
                    // Eliminamos el modal automático para no ser intrusivos, 
                    // pero si se desea comportamiento anterior, descomentar:
                    // setMostrarModalCaja(true) 
                }
            }
        } catch (error) {
            console.error('Error al verificar caja:', error)
        }
    }

    const cargarVentas = async (pagina = paginaActual) => {
        setCargando(true)
        try {
            // 🔹 Construir objeto de filtros
            const filtros = {
                pagina,
                limite,
                soloCajaAbierta,
                busqueda: busqueda.trim() || null
            }

            // Período
            if (periodo && periodo !== 'personalizado') {
                filtros.periodo = periodo
            } else if (periodo === 'personalizado') {
                filtros.fechaInicio = fechaInicio || null
                filtros.fechaFin = fechaFin || null
            }

            // Filtros avanzados
            if (filtrosAvanzados.vendedorId) filtros.vendedorId = filtrosAvanzados.vendedorId
            if (filtrosAvanzados.clienteId) filtros.clienteId = filtrosAvanzados.clienteId
            // if (filtrosAvanzados.tipo) filtros.tipo = filtrosAvanzados.tipo
            if (filtrosAvanzados.estado) filtros.estado = filtrosAvanzados.estado
            if (filtrosAvanzados.metodo) filtros.metodo = filtrosAvanzados.metodo
            if (filtrosAvanzados.minTotal) filtros.minTotal = parseFloat(filtrosAvanzados.minTotal)
            if (filtrosAvanzados.maxTotal) filtros.maxTotal = parseFloat(filtrosAvanzados.maxTotal)

            const resultado = await obtenerVentas(filtros)

            if (resultado.success) {
                setVentas(resultado.ventas)
                setResumen(resultado.resumen)

                if (resultado.paginacion) {
                    setPaginaActual(resultado.paginacion.pagina)
                    setTotalPaginas(resultado.paginacion.totalPaginas)
                    setTotalVentas(resultado.paginacion.total)
                }
            }
        } catch (error) {
            console.error('Error al cargar ventas:', error)
        } finally {
            setCargando(false)
        }
    }

    const manejarAbrirCaja = async (e) => {
        e.preventDefault()

        if (!montoInicial || parseFloat(montoInicial) < 0) {
            Swal.fire('Error', 'Por favor ingresa un monto inicial válido', 'error')
            return
        }

        setProcesando(true)
        try {
            const resultado = await abrirCaja(parseFloat(montoInicial))
            if (resultado.success) {
                setCajaAbierta(true)
                setDatosCaja(resultado.caja)
                setMostrarModalCaja(false)
                Swal.fire('Éxito', resultado.mensaje, 'success')
            } else {
                Swal.fire('Error', resultado.mensaje || 'Error al abrir caja', 'error')
            }
        } catch (error) {
            console.error('Error al abrir caja:', error)
            Swal.fire('Error', 'Error al procesar la solicitud', 'error')
        } finally {
            setProcesando(false)
        }
    }

    const manejarCerrarCaja = async (e) => {
        e.preventDefault()

        if (!montoFinal || parseFloat(montoFinal) < 0) {
            Swal.fire('Error', 'Por favor ingresa el monto final en efectivo (cuadre)', 'error')
            return
        }

        // Confirmación
        const confirmacion = await Swal.fire({
            title: '¿Cerrar Caja?',
            text: "Esta acción finalizará el turno actual y calculará las diferencias. ¿Estás seguro?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, cerrar caja',
            cancelButtonText: 'Cancelar'
        })

        if (!confirmacion.isConfirmed) return

        setProcesando(true)
        try {
            const resultado = await cerrarCaja(parseFloat(montoFinal))
            if (resultado.success) {
                setCajaAbierta(false)
                setDatosCaja(null)
                setMostrarModalCierre(false)

                // Mostrar resumen de cierre
                Swal.fire({
                    title: 'Caja Cerrada',
                    html: `
                        <p><strong>Efectivo Contado:</strong> ${formatearMoneda(resultado.resumen.contado)}</p>
                        <p><strong>Efectivo Esperado:</strong> ${formatearMoneda(resultado.resumen.esperado)}</p>
                        <p><strong>Diferencia:</strong> <span style="color: ${resultado.resumen.diferencia < 0 ? 'red' : 'green'}">${formatearMoneda(resultado.resumen.diferencia)}</span></p>
                    `,
                    icon: 'success'
                })

                cargarVentas() // Recargar para limpiar info si es necesario
            } else {
                Swal.fire('Error', resultado.mensaje || 'Error al cerrar caja', 'error')
            }
        } catch (error) {
            console.error('Error al cerrar caja:', error)
            Swal.fire('Error', 'Error al procesar la solicitud', 'error')
        } finally {
            setProcesando(false)
        }
    }

    const manejarAnularVenta = async (ventaId, numeroInterno) => {
        const { value: razon } = await Swal.fire({
            title: `Anular Venta ${numeroInterno}`,
            input: 'textarea',
            inputLabel: 'Razón de anulación',
            inputPlaceholder: 'Escribe la razón aquí...',
            inputAttributes: {
                'aria-label': 'Escribe la razón de anulación'
            },
            showCancelButton: true
        })

        if (!razon) return

        setProcesando(true)
        try {
            const resultado = await anularVenta(ventaId, razon.trim())
            if (resultado.success) {
                await cargarVentas()
                Swal.fire('Anulada', resultado.mensaje, 'success')
            } else {
                Swal.fire('Error', resultado.mensaje || 'Error al anular venta', 'error')
            }
        } catch (error) {
            console.error('Error al anular venta:', error)
            Swal.fire('Error', 'Error al procesar la solicitud', 'error')
        } finally {
            setProcesando(false)
        }
    }

    const limpiarFiltrosAvanzados = () => {
        setFiltrosAvanzados({
            vendedorId: '',
            clienteId: '',
            // tipo: '',
            estado: '',
            metodo: '',
            minTotal: '',
            maxTotal: ''
        })
    }

    // ============================================
    // 🎨 FUNCIONES DE UTILIDAD
    // ============================================

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2
        }).format(monto)
    }

    const getMetodoPagoBadge = (metodo) => {
        const metodos = {
            efectivo: { texto: 'Efectivo', color: 'efectivo' },
            tarjeta_debito: { texto: 'Débito', color: 'debito' },
            tarjeta_credito: { texto: 'Crédito TC', color: 'tarjetaCredito' },
            transferencia: { texto: 'Transfer.', color: 'transferencia' },
            cheque: { texto: 'Cheque', color: 'cheque' },
            credito: { texto: 'Crédito', color: 'credito' }
        }
        return metodos[metodo] || metodos.efectivo
    }

    const getDgiiBadge = (estado) => {
        const estados = {
            enviado: { texto: 'Enviado', color: 'debito' },
            aceptado: { texto: 'Aceptado', color: 'emitida' },
            rechazado: { texto: 'Rechazado', color: 'anulada' },
            no_enviado: { texto: 'No Enviado', color: 'pendiente' }
        }
        return estados[estado] || estados.no_enviado
    }

    // ============================================
    // 🎨 RENDERIZADO
    // ============================================

    return (
        <div className={`${estilos.contenedorOptimizado} ${estilos[tema]}`}>
            {/* ========== HEADER ========== */}
            <div className={estilos.header}>
                <div className={estilos.headerInfo}>
                    <h1 className={estilos.titulo}>Ventas</h1>
                    <p className={estilos.subtitulo}>
                        {soloCajaAbierta
                            ? 'Mostrando ventas de la caja abierta'
                            : 'Mostrando todas las ventas de la empresa'}
                    </p>
                </div>
                <div className={estilos.headerAcciones}>
                    {!cajaAbierta ? (
                        <button
                            className={estilos.btnAbrirCaja}
                            onClick={() => setMostrarModalCaja(true)}
                        >
                            <ion-icon name="lock-open-outline"></ion-icon>
                            <span>Abrir Caja</span>
                        </button>
                    ) : (
                        <button
                            className={estilos.btnAbrirCaja} // Usamos mismos estilos base pero quizás color diferente
                            style={{ background: 'var(--danger)', color: 'white' }}
                            onClick={() => setMostrarModalCierre(true)}
                        >
                            <ion-icon name="lock-closed-outline"></ion-icon>
                            <span>Cerrar Caja</span>
                        </button>
                    )}
                    <Link href="/admin/ventas/nueva" className={estilos.btnNuevo}>
                        <ion-icon name="add-circle-outline"></ion-icon>
                        <span>Nueva Venta</span>
                    </Link>
                </div>
            </div>

            {/* ========== INFO CAJA ABIERTA ========== */}
            {datosCaja && cajaAbierta && (
                <div className={estilos.alertaCaja}>
                    <div className={estilos.alertaIcono}>
                        <ion-icon name="cash-outline"></ion-icon>
                    </div>
                    <div className={estilos.alertaInfo}>
                        <span className={estilos.alertaTitulo}>Caja #{datosCaja.numero_caja} Abierta</span>
                        <span className={estilos.alertaTexto}>
                            Monto inicial: {formatearMoneda(datosCaja.monto_inicial)} |
                            Ventas del día: {formatearMoneda(datosCaja.total_ventas)}
                        </span>
                    </div>
                </div>
            )}

            {/* ========== RESUMEN RÁPIDO ========== */}
            <div className={estilos.resumen}>
                <div className={estilos.resumenCard}>
                    <div className={estilos.resumenIcono}>
                        <ion-icon name="trending-up-outline"></ion-icon>
                    </div>
                    <div className={estilos.resumenInfo}>
                        <span className={estilos.resumenLabel}>Total Ventas</span>
                        <span className={estilos.resumenValor}>{formatearMoneda(resumen.totalVentas)}</span>
                    </div>
                </div>

                <div className={estilos.resumenCard}>
                    <div className={`${estilos.resumenIcono} ${estilos.success}`}>
                        <ion-icon name="checkmark-circle-outline"></ion-icon>
                    </div>
                    <div className={estilos.resumenInfo}>
                        <span className={estilos.resumenLabel}>Emitidas</span>
                        <span className={estilos.resumenValor}>{resumen.cantidadEmitidas}</span>
                    </div>
                </div>

                <div className={estilos.resumenCard}>
                    <div className={`${estilos.resumenIcono} ${estilos.danger}`}>
                        <ion-icon name="close-circle-outline"></ion-icon>
                    </div>
                    <div className={estilos.resumenInfo}>
                        <span className={estilos.resumenLabel}>Anuladas</span>
                        <span className={estilos.resumenValor}>{resumen.cantidadAnuladas}</span>
                    </div>
                </div>

                <div className={estilos.resumenCard}>
                    <div className={`${estilos.resumenIcono} ${estilos.warning}`}>
                        <ion-icon name="time-outline"></ion-icon>
                    </div>
                    <div className={estilos.resumenInfo}>
                        <span className={estilos.resumenLabel}>Pendientes</span>
                        <span className={estilos.resumenValor}>{resumen.cantidadPendientes}</span>
                    </div>
                </div>
            </div>

            {/* ========== FILTROS RÁPIDOS (PERÍODO) ========== */}
            <div className={estilos.filtrosRapidos}>
                <div className={estilos.chipsPeriodo}>
                    <button
                        className={`${estilos.chip} ${periodo === 'hoy' ? estilos.chipActivo : ''}`}
                        onClick={() => setPeriodo('hoy')}
                    >
                        Hoy
                    </button>
                    <button
                        className={`${estilos.chip} ${periodo === 'semana' ? estilos.chipActivo : ''}`}
                        onClick={() => setPeriodo('semana')}
                    >
                        Semana
                    </button>
                    <button
                        className={`${estilos.chip} ${periodo === 'mes' ? estilos.chipActivo : ''}`}
                        onClick={() => setPeriodo('mes')}
                    >
                        Mes
                    </button>
                    <button
                        className={`${estilos.chip} ${periodo === 'personalizado' ? estilos.chipActivo : ''}`}
                        onClick={() => setPeriodo('personalizado')}
                    >
                        <ion-icon name="calendar-outline"></ion-icon>
                        Rango
                    </button>
                </div>

                <div className={estilos.toggleCaja}>
                    <label className={estilos.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={soloCajaAbierta}
                            onChange={(e) => setSoloCajaAbierta(e.target.checked)}
                            className={estilos.checkbox}
                        />
                        <span>Solo caja abierta</span>
                    </label>
                </div>
            </div>

            {/* ========== RANGO PERSONALIZADO ========== */}
            {periodo === 'personalizado' && (
                <div className={estilos.rangoPers}>
                    <div className={estilos.grupoFecha}>
                        <label>Desde</label>
                        <input
                            type="date"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            className={estilos.inputFecha}
                        />
                    </div>
                    <div className={estilos.grupoFecha}>
                        <label>Hasta</label>
                        <input
                            type="date"
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                            className={estilos.inputFecha}
                            min={fechaInicio || undefined}
                        />
                    </div>
                </div>
            )}

            {/* ========== BÚSQUEDA Y FILTROS AVANZADOS ========== */}
            <div className={estilos.barraBusqueda}>
                <div className={estilos.busqueda}>
                    <ion-icon name="search-outline"></ion-icon>
                    <input
                        type="text"
                        placeholder="Buscar por número, cliente o vendedor..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className={estilos.inputBusqueda}
                    />
                </div>
                <button
                    className={estilos.btnFiltros}
                    onClick={() => setMostrarFiltros(!mostrarFiltros)}
                >
                    <ion-icon name="options-outline"></ion-icon>
                    <span>Filtros</span>
                </button>
            </div>

            {/* ========== PANEL DE FILTROS AVANZADOS ========== */}
            {mostrarFiltros && (
                <div className={estilos.filtrosAvanzados}>
                    <div className={estilos.filtrosGrid}>
                        <div className={estilos.grupoFiltro}>
                            <label>Estado</label>
                            <select
                                value={filtrosAvanzados.estado}
                                onChange={(e) => setFiltrosAvanzados({ ...filtrosAvanzados, estado: e.target.value })}
                                className={estilos.selectFiltro}
                            >
                                <option value="">Todos</option>
                                <option value="emitida">Emitida</option>
                                <option value="anulada">Anulada</option>
                                <option value="pendiente">Pendiente</option>
                            </select>
                        </div>



                        <div className={estilos.grupoFiltro}>
                            <label>Método de Pago</label>
                            <select
                                value={filtrosAvanzados.metodo}
                                onChange={(e) => setFiltrosAvanzados({ ...filtrosAvanzados, metodo: e.target.value })}
                                className={estilos.selectFiltro}
                            >
                                <option value="">Todos</option>
                                <option value="efectivo">Efectivo</option>
                                <option value="tarjeta_debito">Tarjeta Débito</option>
                                <option value="tarjeta_credito">Tarjeta Crédito</option>
                                <option value="transferencia">Transferencia</option>
                                <option value="cheque">Cheque</option>
                                <option value="credito">Crédito</option>
                            </select>
                        </div>

                        <div className={estilos.grupoFiltro}>
                            <label>Monto Mínimo</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={filtrosAvanzados.minTotal}
                                onChange={(e) => setFiltrosAvanzados({ ...filtrosAvanzados, minTotal: e.target.value })}
                                placeholder="RD$ 0.00"
                                className={estilos.inputFiltro}
                            />
                        </div>

                        <div className={estilos.grupoFiltro}>
                            <label>Monto Máximo</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={filtrosAvanzados.maxTotal}
                                onChange={(e) => setFiltrosAvanzados({ ...filtrosAvanzados, maxTotal: e.target.value })}
                                placeholder="RD$ 0.00"
                                className={estilos.inputFiltro}
                            />
                        </div>
                    </div>

                    <div className={estilos.filtrosAcciones}>
                        <button
                            className={estilos.btnLimpiar}
                            onClick={limpiarFiltrosAvanzados}
                        >
                            Limpiar
                        </button>
                        <button
                            className={estilos.btnAplicar}
                            onClick={() => {
                                setPaginaActual(1)
                                cargarVentas()
                                if (vistaMovil) setMostrarFiltros(false)
                            }}
                        >
                            Aplicar
                        </button>
                    </div>
                </div>
            )}

            {/* ========== LISTA DE VENTAS ========== */}
            {cargando ? (
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando ventas...</span>
                </div>
            ) : ventas.length === 0 ? (
                <div className={estilos.vacio}>
                    <ion-icon name="receipt-outline"></ion-icon>
                    <span>No hay ventas que coincidan con tus filtros</span>
                </div>
            ) : vistaMovil ? (
                // ========== VISTA MÓVIL (CARDS) ==========
                <div className={estilos.listaMovil}>
                    {ventas.map((venta) => {
                        const tieneDespachoPendiente = venta.tipo_entrega === 'parcial' && venta.despacho_completo === 0 && venta.estado === 'emitida'
                        const metodoBadge = getMetodoPagoBadge(venta.metodo_pago)
                        const dgiiBadge = getDgiiBadge(venta.estado_dgii)

                        return (
                            <div key={venta.id} className={estilos.cardMovil}>
                                <div className={estilos.cardHeader}>
                                    <div className={estilos.cardNumero}>
                                        <span className={estilos.numeroInterno}>{venta.numero_interno}</span>
                                        <span className={estilos.numeroCaja}>{venta.ncf || 'Sin NCF'}</span>
                                    </div>
                                    <span className={estilos.cardMonto}>{formatearMoneda(venta.total)}</span>
                                </div>

                                <div className={estilos.cardBody}>
                                    <div className={estilos.cardRow}>
                                        <span className={estilos.cardLabel}>Cliente:</span>
                                        <span className={estilos.cardValue}>{venta.cliente_nombre || 'Consumidor Final'}</span>
                                    </div>
                                    <div className={estilos.cardRow}>
                                        <span className={estilos.cardLabel}>Vendedor:</span>
                                        <span className={estilos.cardValue}>{venta.vendedor_nombre || 'N/A'}</span>
                                    </div>
                                    <div className={estilos.cardRow}>
                                        <div className={estilos.cardBadges}>
                                            <span className={`${estilos.badge} ${estilos[metodoBadge.color]}`}>
                                                {metodoBadge.texto}
                                            </span>
                                            <span className={`${estilos.badge} ${estilos[dgiiBadge.color]}`} title={`DGII: ${dgiiBadge.texto}`}>
                                                {dgiiBadge.texto}
                                            </span>
                                            <span className={`${estilos.badge} ${estilos[venta.estado]}`}>
                                                {venta.estado === 'emitida' ? 'Emitida' : venta.estado === 'anulada' ? 'Anulada' : 'Pendiente'}
                                            </span>
                                            {tieneDespachoPendiente && (
                                                <span className={`${estilos.badge} ${estilos.despachoPendiente}`}>
                                                    Desp. Pend.
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className={estilos.cardAcciones}>
                                    <Link href={`/admin/ventas/ver/${venta.id}`} className={estilos.btnIcono} title="Ver">
                                        <ion-icon name="eye-outline"></ion-icon>
                                    </Link>
                                    <Link href={`/admin/ventas/imprimir/${venta.id}`} className={`${estilos.btnIcono} ${estilos.imprimir}`} title="Imprimir">
                                        <ion-icon name="print-outline"></ion-icon>
                                    </Link>
                                    {tieneDespachoPendiente && (
                                        <Link href={`/admin/conduces/crear?origen=venta&numero=${venta.numero_interno}`} className={`${estilos.btnIcono} ${estilos.despachar}`} title="Despachar">
                                            <ion-icon name="cube-outline"></ion-icon>
                                        </Link>
                                    )}
                                    {venta.estado === 'emitida' && (
                                        <button
                                            className={`${estilos.btnIcono} ${estilos.anular}`}
                                            onClick={() => manejarAnularVenta(venta.id, venta.numero_interno)}
                                            disabled={procesando}
                                            title="Anular"
                                        >
                                            <ion-icon name="close-circle-outline"></ion-icon>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                // ========== VISTA DESKTOP (TABLA) ==========
                <div className={estilos.tablaContainer}>
                    <table className={estilos.tabla}>
                        <thead className={estilos.tablaHeader}>
                            <tr>
                                <th>Número</th>
                                <th>NCF</th>
                                <th>Caja</th>
                                <th>Cliente</th>
                                <th>Vendedor</th>
                                <th>Método</th>
                                <th>DGII</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ventas.map((venta) => {
                                const tieneDespachoPendiente = venta.tipo_entrega === 'parcial' && venta.despacho_completo === 0 && venta.estado === 'emitida'
                                const metodoBadge = getMetodoPagoBadge(venta.metodo_pago)
                                const dgiiBadge = getDgiiBadge(venta.estado_dgii)

                                return (
                                    <tr key={venta.id} className={estilos.fila}>
                                        <td className={estilos.numeroCol}>{venta.numero_interno}</td>
                                        <td className={estilos.numeroCol}>{venta.ncf || '-'}</td>
                                        <td>{venta.numero_caja ? `#${venta.numero_caja}` : 'N/A'}</td>
                                        <td>{venta.cliente_nombre || 'Consumidor Final'}</td>
                                        <td>{venta.vendedor_nombre || 'N/A'}</td>
                                        <td>
                                            <span className={`${estilos.badge} ${estilos[metodoBadge.color]}`}>
                                                {metodoBadge.texto}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`${estilos.badge} ${estilos[dgiiBadge.color]}`}>
                                                {dgiiBadge.texto}
                                            </span>
                                        </td>
                                        <td className={estilos.montoCol}>{formatearMoneda(venta.total)}</td>
                                        <td>
                                            <div className={estilos.estadoContainer}>
                                                <span className={`${estilos.badge} ${estilos[venta.estado]}`}>
                                                    {venta.estado === 'emitida' ? 'Emitida' : venta.estado === 'anulada' ? 'Anulada' : 'Pendiente'}
                                                </span>
                                                {tieneDespachoPendiente && (
                                                    <span className={`${estilos.badge} ${estilos.despachoPendiente}`}>
                                                        Desp. Pend.
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className={estilos.accionesTabla}>
                                                <Link href={`/admin/ventas/ver/${venta.id}`} className={estilos.btnIcono} title="Ver">
                                                    <ion-icon name="eye-outline"></ion-icon>
                                                </Link>
                                                <Link href={`/admin/ventas/imprimir/${venta.id}`} className={`${estilos.btnIcono} ${estilos.imprimir}`} title="Imprimir">
                                                    <ion-icon name="print-outline"></ion-icon>
                                                </Link>
                                                {tieneDespachoPendiente && (
                                                    <Link href={`/admin/conduces/crear?origen=venta&numero=${venta.numero_interno}`} className={`${estilos.btnIcono} ${estilos.despachar}`} title="Despachar">
                                                        <ion-icon name="cube-outline"></ion-icon>
                                                    </Link>
                                                )}
                                                {venta.estado === 'emitida' && (
                                                    <button
                                                        className={`${estilos.btnIcono} ${estilos.anular}`}
                                                        onClick={() => manejarAnularVenta(venta.id, venta.numero_interno)}
                                                        disabled={procesando}
                                                        title="Anular"
                                                    >
                                                        <ion-icon name="close-circle-outline"></ion-icon>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ========== PAGINACIÓN ========== */}
            {!cargando && ventas.length > 0 && totalPaginas > 1 && (
                <div className={estilos.paginacion}>
                    <div className={estilos.paginacionInfo}>
                        <span>
                            Mostrando {(paginaActual - 1) * limite + 1}-{Math.min(paginaActual * limite, totalVentas)} de {totalVentas} ventas
                        </span>
                    </div>
                    <div className={estilos.paginacionControles}>
                        <button
                            className={estilos.btnPaginacion}
                            onClick={() => {
                                const nuevaPagina = paginaActual - 1
                                setPaginaActual(nuevaPagina)
                                cargarVentas(nuevaPagina)
                            }}
                            disabled={paginaActual === 1 || cargando}
                        >
                            <ion-icon name="chevron-back-outline"></ion-icon>
                        </button>

                        <div className={estilos.numerosPagina}>
                            {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                                let numeroPagina
                                if (totalPaginas <= 5) {
                                    numeroPagina = i + 1
                                } else if (paginaActual <= 3) {
                                    numeroPagina = i + 1
                                } else if (paginaActual >= totalPaginas - 2) {
                                    numeroPagina = totalPaginas - 4 + i
                                } else {
                                    numeroPagina = paginaActual - 2 + i
                                }

                                return (
                                    <button
                                        key={numeroPagina}
                                        className={`${estilos.btnNumeroPagina} ${paginaActual === numeroPagina ? estilos.activa : ''}`}
                                        onClick={() => {
                                            setPaginaActual(numeroPagina)
                                            cargarVentas(numeroPagina)
                                        }}
                                        disabled={cargando}
                                    >
                                        {numeroPagina}
                                    </button>
                                )
                            })}
                        </div>

                        <button
                            className={estilos.btnPaginacion}
                            onClick={() => {
                                const nuevaPagina = paginaActual + 1
                                setPaginaActual(nuevaPagina)
                                cargarVentas(nuevaPagina)
                            }}
                            disabled={paginaActual === totalPaginas || cargando}
                        >
                            <ion-icon name="chevron-forward-outline"></ion-icon>
                        </button>
                    </div>
                </div>
            )}

            {/* ========== MODAL ABRIR CAJA ========== */}
            {mostrarModalCaja && (
                <div className={estilos.modalOverlay}>
                    <div className={estilos.modal}>
                        <div className={estilos.modalHeader}>
                            <h2>Abrir Caja</h2>
                            <button
                                className={estilos.btnCerrar}
                                onClick={() => !procesando && setMostrarModalCaja(false)}
                                disabled={procesando}
                            >
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>

                        <form onSubmit={manejarAbrirCaja} className={estilos.modalBody}>
                            <div className={estilos.infoCaja}>
                                <ion-icon name="information-circle-outline"></ion-icon>
                                <p>Ingresa el monto con el que iniciarás las operaciones del día.</p>
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>Monto Inicial (RD$)</label>
                                <div className={estilos.inputMoneda}>
                                    <span className={estilos.simboloMoneda}>RD$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={montoInicial}
                                        onChange={(e) => setMontoInicial(e.target.value)}
                                        placeholder="0.00"
                                        required
                                        disabled={procesando}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className={estilos.modalFooter}>
                                <button
                                    type="button"
                                    className={estilos.btnCancelar}
                                    onClick={() => setMostrarModalCaja(false)}
                                    disabled={procesando}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className={estilos.btnGuardar}
                                    disabled={procesando}
                                >
                                    {procesando ? 'Abriendo...' : 'Abrir Caja'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========== MODAL CERRAR CAJA ========== */}
            {mostrarModalCierre && (
                <div className={estilos.modalOverlay}>
                    <div className={estilos.modal}>
                        <div className={estilos.modalHeader}>
                            <h2>Cerrar Caja</h2>
                            <button
                                className={estilos.btnCerrar}
                                onClick={() => !procesando && setMostrarModalCierre(false)}
                                disabled={procesando}
                            >
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>

                        <form onSubmit={manejarCerrarCaja} className={estilos.modalBody}>
                            <div className={estilos.infoCaja}>
                                <ion-icon name="alert-circle-outline"></ion-icon>
                                <p>Ingresa el monto total en efectivo que tienes físicamente en la caja para realizar el cuadre.</p>
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>Efectivo en Caja (RD$)</label>
                                <div className={estilos.inputMoneda}>
                                    <span className={estilos.simboloMoneda}>RD$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={montoFinal}
                                        onChange={(e) => setMontoFinal(e.target.value)}
                                        placeholder="0.00"
                                        required
                                        disabled={procesando}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className={estilos.modalFooter}>
                                <button
                                    type="button"
                                    className={estilos.btnCancelar}
                                    onClick={() => setMostrarModalCierre(false)}
                                    disabled={procesando}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className={estilos.btnGuardar} // o btnPeligro si defines ese estilo
                                    style={{ background: 'var(--danger)', color: 'white' }}
                                    disabled={procesando}
                                >
                                    {procesando ? 'Cerrando...' : 'Cerrar Caja'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}