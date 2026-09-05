"use client"
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { obtenerDatosCaja, abrirCaja, cerrarCaja, obtenerVentas, anularVenta, obtenerDatosEmpresa } from './servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './ventas.module.css'
import Swal from 'sweetalert2'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function VentasAdmin({ basePath = '/admin' }) {
    const router = useRouter()
    const { t, language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)
    // Refuerzo: bloqueo inmediato antes de renderizar nada
    if (typeof window !== 'undefined') {
        const tipo = localStorage.getItem('userTipo') || (() => {
            const match = document.cookie.match(/userTipo=([^;]+)/)
            return match ? match[1] : ''
        })()
        if (tipo === 'financiamiento') {
            router.replace('/admin/financiamiento')
            return null
        }
    }
    // ...existing code...
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(false)
    const [cajaAbierta, setCajaAbierta] = useState(false)
    const [datosCaja, setDatosCaja] = useState(null)
    const [datosEmpresa, setDatosEmpresa] = useState(null)

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
        cantidadPendientes: 0,
        totalEfectivo: 0,
        totalCredito: 0,
        cantidadEfectivo: 0,
        cantidadCredito: 0,
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
    const ultimaSolicitudRef = useRef(0)
    const chipsMetodoRef = useRef(null)
    const chipsPeriodoRef = useRef(null)
    const [controlesCarrusel, setControlesCarrusel] = useState({
        metodo: { mostrar: false, izquierda: false, derecha: false },
        periodo: { mostrar: false, izquierda: false, derecha: false }
    })

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
        const actualizarCarruseles = () => {
            const construirEstado = (el) => {
                if (!el || !vistaMovil) {
                    return { mostrar: false, izquierda: false, derecha: false }
                }

                const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth)
                const mostrar = maxScroll > 2
                return {
                    mostrar,
                    izquierda: mostrar && el.scrollLeft > 4,
                    derecha: mostrar && el.scrollLeft < maxScroll - 4
                }
            }

            setControlesCarrusel({
                metodo: construirEstado(chipsMetodoRef.current),
                periodo: construirEstado(chipsPeriodoRef.current)
            })
        }

        actualizarCarruseles()
        window.addEventListener('resize', actualizarCarruseles)

        return () => window.removeEventListener('resize', actualizarCarruseles)
    }, [vistaMovil, periodo, filtrosAvanzados.metodo])

    useEffect(() => {
        verificarCaja()
        cargarVentas() // 🔹 NUEVO: Cargar ventas aunque no haya caja abierta
        cargarDatosEmpresa()
    }, [])

    // ============================================
    // 🔄 RECARGAR CUANDO CAMBIAN LOS FILTROS
    // ============================================

    useEffect(() => {
        setPaginaActual(1) // Reset a primera página
        cargarVentas(1)
    }, [periodo, soloCajaAbierta, filtrosAvanzados, fechaInicio, fechaFin])

    // ============================================
    // 🎯 FUNCIONES PRINCIPALES
    // ============================================

    const formatearFechaLocal = (fecha) => {
        const year = fecha.getFullYear()
        const month = String(fecha.getMonth() + 1).padStart(2, '0')
        const day = String(fecha.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    const obtenerRangoPeriodo = (periodoActual) => {
        const hoy = new Date()

        if (periodoActual === 'hoy') {
            const fecha = formatearFechaLocal(hoy)
            return { fechaInicio: fecha, fechaFin: fecha }
        }

        if (periodoActual === 'semana') {
            const inicioSemana = new Date(hoy)
            inicioSemana.setDate(hoy.getDate() - hoy.getDay())

            const finSemana = new Date(inicioSemana)
            finSemana.setDate(inicioSemana.getDate() + 6)

            return {
                fechaInicio: formatearFechaLocal(inicioSemana),
                fechaFin: formatearFechaLocal(finSemana)
            }
        }

        if (periodoActual === 'mes') {
            const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
            const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)

            return {
                fechaInicio: formatearFechaLocal(inicioMes),
                fechaFin: formatearFechaLocal(finMes)
            }
        }

        return { fechaInicio: null, fechaFin: null }
    }

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

    const cargarDatosEmpresa = async () => {
        try {
            const resultado = await obtenerDatosEmpresa()
            if (resultado.success) setDatosEmpresa(resultado.empresa)
        } catch (error) {
            console.error('Error al cargar datos empresa:', error)
        }
    }

    const cargarVentas = async (pagina = paginaActual) => {
        const solicitudId = ++ultimaSolicitudRef.current
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
            if (periodo === 'personalizado') {
                filtros.fechaInicio = fechaInicio || null
                filtros.fechaFin = fechaFin || null
            } else {
                const rango = obtenerRangoPeriodo(periodo)
                filtros.fechaInicio = rango.fechaInicio
                filtros.fechaFin = rango.fechaFin
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

            if (solicitudId !== ultimaSolicitudRef.current) {
                return
            }

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
            if (solicitudId === ultimaSolicitudRef.current) {
                setCargando(false)
            }
        }
    }

    const manejarAbrirCaja = async (e) => {
        e.preventDefault()

        if (!montoInicial || parseFloat(montoInicial) < 0) {
            Swal.fire('Error', t('ventas.errorMontoInicial'), 'error')
            return
        }

        setProcesando(true)
        try {
            const resultado = await abrirCaja(parseFloat(montoInicial))
            if (resultado.success) {
                setCajaAbierta(true)
                setDatosCaja(resultado.caja)
                setMostrarModalCaja(false)
                Swal.fire(tr('Éxito', 'Success'), resultado.mensaje, 'success')
            } else {
                Swal.fire('Error', resultado.mensaje || tr('Error al abrir caja', 'Error opening register'), 'error')
            }
        } catch (error) {
            console.error('Error al abrir caja:', error)
            Swal.fire('Error', t('ventas.errorProcesar'), 'error')
        } finally {
            setProcesando(false)
        }
    }

    const manejarCerrarCaja = async (e) => {
        e.preventDefault()

        if (!montoFinal || parseFloat(montoFinal) < 0) {
            Swal.fire('Error', t('ventas.errorMontoFinal'), 'error')
            return
        }

        const confirmacion = await Swal.fire({
            title: t('ventas.confirmarCerrarTitulo'),
            text: t('ventas.confirmarCerrarTexto'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: t('ventas.confirmarCerrarBtn'),
            cancelButtonText: t('ventas.cancelar')
        })

        if (!confirmacion.isConfirmed) return

        setProcesando(true)
        try {
            const resultado = await cerrarCaja(parseFloat(montoFinal))
            if (resultado.success) {
                setCajaAbierta(false)
                setDatosCaja(null)
                setMostrarModalCierre(false)

                Swal.fire({
                    title: t('ventas.cajaCerrada'),
                    html: `
                        <p><strong>${t('ventas.efectivoContado')}:</strong> ${formatearMoneda(resultado.resumen.contado)}</p>
                        <p><strong>${t('ventas.efectivoEsperado')}:</strong> ${formatearMoneda(resultado.resumen.esperado)}</p>
                        <p><strong>${t('ventas.diferencia')}:</strong> <span style="color: ${resultado.resumen.diferencia < 0 ? 'red' : 'green'}">${formatearMoneda(resultado.resumen.diferencia)}</span></p>
                    `,
                    icon: 'success'
                })

                cargarVentas() // Recargar para limpiar info si es necesario
            } else {
                Swal.fire('Error', resultado.mensaje || tr('Error al cerrar caja', 'Error closing register'), 'error')
            }
        } catch (error) {
            console.error('Error al cerrar caja:', error)
            Swal.fire('Error', t('ventas.errorProcesar'), 'error')
        } finally {
            setProcesando(false)
        }
    }

    const manejarAnularVenta = async (ventaId, numeroInterno) => {
        const { value: razon } = await Swal.fire({
            title: `${t('ventas.anularVentaTitulo')} ${numeroInterno}`,
            input: 'textarea',
            inputLabel: t('ventas.razonAnulacion'),
            inputPlaceholder: t('ventas.razonPlaceholder'),
            inputAttributes: {
                'aria-label': t('ventas.razonAnulacion')
            },
            showCancelButton: true
        })

        if (!razon) return

        setProcesando(true)
        try {
            const resultado = await anularVenta(ventaId, razon.trim())
            if (resultado.success) {
                await cargarVentas()
                Swal.fire(t('ventas.anuladaExito'), resultado.mensaje, 'success')
            } else {
                Swal.fire('Error', resultado.mensaje || tr('Error al anular venta', 'Error voiding sale'), 'error')
            }
        } catch (error) {
            console.error('Error al anular venta:', error)
            Swal.fire('Error', t('ventas.errorProcesar'), 'error')
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

    const desplazarCarrusel = (tipo, direccion) => {
        const ref = tipo === 'metodo' ? chipsMetodoRef : chipsPeriodoRef
        const contenedor = ref.current
        if (!contenedor) return

        contenedor.scrollBy({
            left: direccion === 'izquierda' ? -180 : 180,
            behavior: 'smooth'
        })

        setTimeout(() => {
            const maxScroll = Math.max(0, contenedor.scrollWidth - contenedor.clientWidth)
            const mostrar = maxScroll > 2
            setControlesCarrusel((prev) => ({
                ...prev,
                [tipo]: {
                    mostrar,
                    izquierda: mostrar && contenedor.scrollLeft > 4,
                    derecha: mostrar && contenedor.scrollLeft < maxScroll - 4
                }
            }))
        }, 220)
    }

    const manejarScrollCarrusel = (tipo) => {
        const ref = tipo === 'metodo' ? chipsMetodoRef : chipsPeriodoRef
        const contenedor = ref.current
        if (!contenedor) return

        const maxScroll = Math.max(0, contenedor.scrollWidth - contenedor.clientWidth)
        const mostrar = maxScroll > 2
        setControlesCarrusel((prev) => ({
            ...prev,
            [tipo]: {
                mostrar,
                izquierda: mostrar && contenedor.scrollLeft > 4,
                derecha: mostrar && contenedor.scrollLeft < maxScroll - 4
            }
        }))
    }

    // ============================================
    // 🎨 FUNCIONES DE UTILIDAD
    // ============================================

    const formatearMoneda = (monto) => {
        const locale = datosEmpresa?.locale || 'es-DO'
        const simbolo = datosEmpresa?.simbolo_moneda || 'RD$'
        try {
            const numero = new Intl.NumberFormat(locale, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(monto || 0)
            return `${simbolo} ${numero}`
        } catch {
            return `${simbolo} ${Number(monto || 0).toFixed(2)}`
        }
    }

    const getMetodoPagoBadge = (metodo) => {
        const metodos = {
            efectivo: { texto: tr('Efectivo', 'Cash'), color: 'efectivo' },
            tarjeta_debito: { texto: tr('Débito', 'Debit'), color: 'debito' },
            tarjeta_credito: { texto: tr('Crédito TC', 'Credit Card'), color: 'tarjetaCredito' },
            transferencia: { texto: tr('Transfer.', 'Transfer'), color: 'transferencia' },
            cheque: { texto: tr('Cheque', 'Check'), color: 'cheque' },
            credito: { texto: tr('Crédito', 'Credit'), color: 'credito' }
        }
        return metodos[metodo] || metodos.efectivo
    }

    const getDgiiBadge = (estado) => {
        const estados = {
            enviado: { texto: tr('Enviado', 'Sent'), color: 'debito' },
            aceptado: { texto: tr('Aceptado', 'Accepted'), color: 'emitida' },
            rechazado: { texto: tr('Rechazado', 'Rejected'), color: 'anulada' },
            no_enviado: { texto: tr('No Enviado', 'Not Sent'), color: 'pendiente' }
        }
        return estados[estado] || estados.no_enviado
    }

    const formatearFechaVisual = (fechaString) => {
        if (!fechaString) return t('ventas.nA')
        const [year, month, day] = fechaString.split('-')
        if (!year || !month || !day) return fechaString
        return `${day}/${month}/${year}`
    }

    const obtenerMetodoActivoTexto = () => {
        const metodo = filtrosAvanzados.metodo
        if (!metodo) return t('ventas.todosMetodos')

        const metodos = {
            efectivo: t('ventas.efectivo'),
            credito: t('ventas.credito'),
            tarjeta_debito: tr('Tarjeta débito', 'Debit card'),
            tarjeta_credito: tr('Tarjeta crédito', 'Credit card'),
            transferencia: tr('Transferencia', 'Transfer'),
            cheque: tr('Cheque', 'Check')
        }

        return metodos[metodo] || metodo
    }

    const obtenerRangoActivo = () => {
        if (periodo === 'personalizado') {
            return {
                etiqueta: t('ventas.rangoPersonalizado'),
                desde: fechaInicio || null,
                hasta: fechaFin || null
            }
        }

        const rango = obtenerRangoPeriodo(periodo)
        return {
            etiqueta: periodo === 'hoy' ? t('ventas.hoy') : periodo === 'semana' ? t('ventas.semanaActual') : t('ventas.mesActual'),
            desde: rango.fechaInicio,
            hasta: rango.fechaFin
        }
    }

    const rangoActivo = obtenerRangoActivo()
    const metodoActivoTexto = obtenerMetodoActivoTexto()

    // ============================================
    // 🎨 RENDERIZADO
    // ============================================

    return (
        <div className={`${estilos.contenedorOptimizado} ${estilos[tema]}`}>
            {/* ========== HEADER ========== */}
            <div className={estilos.header}>
                <div className={estilos.headerInfo}>
                    <h1 className={estilos.titulo}>{t('ventas.titulo')}</h1>
                    <p className={estilos.subtitulo}>
                        {soloCajaAbierta
                            ? t('ventas.subtituloCaja')
                            : t('ventas.subtituloTodas')}
                    </p>
                </div>
                <div className={estilos.headerAcciones}>
                    {!cajaAbierta ? (
                        <button
                            className={estilos.btnAbrirCaja}
                            onClick={() => setMostrarModalCaja(true)}
                        >
                            <ion-icon name="lock-open-outline"></ion-icon>
                            <span>{t('ventas.abrirCaja')}</span>
                        </button>
                    ) : (
                        <button
                            className={estilos.btnAbrirCaja}
                            style={{ background: 'var(--danger)', color: 'white' }}
                            onClick={() => setMostrarModalCierre(true)}
                        >
                            <ion-icon name="lock-closed-outline"></ion-icon>
                            <span>{t('ventas.cerrarCaja')}</span>
                        </button>
                    )}
                    <Link href={`${basePath}/ventas/nueva`} className={estilos.btnNuevo}>
                        <ion-icon name="add-circle-outline"></ion-icon>
                        <span>{t('ventas.nuevaVenta')}</span>
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
                        <span className={estilos.alertaTitulo}>{t('ventas.cajaAbierta')} #{datosCaja.numero_caja}</span>
                        <span className={estilos.alertaTexto}>
                            {t('ventas.montoInicial')} {formatearMoneda(datosCaja.monto_inicial)} |
                            {t('ventas.ventasDelDia')}: {formatearMoneda(datosCaja.total_ventas)}
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
                        <span className={estilos.resumenLabel}>{t('ventas.totalVentas')}</span>
                        <span className={estilos.resumenValor}>{formatearMoneda(resumen.totalVentas)}</span>
                    </div>
                </div>

                <div className={estilos.resumenCard}>
                    <div className={`${estilos.resumenIcono} ${estilos.success}`}>
                        <ion-icon name="checkmark-circle-outline"></ion-icon>
                    </div>
                    <div className={estilos.resumenInfo}>
                        <span className={estilos.resumenLabel}>{t('ventas.emitidas')}</span>
                        <span className={estilos.resumenValor}>{resumen.cantidadEmitidas}</span>
                    </div>
                </div>

                <div className={estilos.resumenCard}>
                    <div className={`${estilos.resumenIcono} ${estilos.danger}`}>
                        <ion-icon name="close-circle-outline"></ion-icon>
                    </div>
                    <div className={estilos.resumenInfo}>
                        <span className={estilos.resumenLabel}>{t('ventas.anuladas')}</span>
                        <span className={estilos.resumenValor}>{resumen.cantidadAnuladas}</span>
                    </div>
                </div>

                <div className={estilos.resumenCard}>
                    <div className={`${estilos.resumenIcono} ${estilos.warning}`}>
                        <ion-icon name="time-outline"></ion-icon>
                    </div>
                    <div className={estilos.resumenInfo}>
                        <span className={estilos.resumenLabel}>{t('ventas.pendientes')}</span>
                        <span className={estilos.resumenValor}>{resumen.cantidadPendientes}</span>
                    </div>
                </div>

                <div className={`${estilos.resumenCard} ${estilos.resumenEfectivo}`}>
                    <div className={`${estilos.resumenIcono} ${estilos.efectivo}`}>
                        <ion-icon name="cash-outline"></ion-icon>
                    </div>
                    <div className={estilos.resumenInfo}>
                        <span className={estilos.resumenLabel}>{t('ventas.efectivo')} ({resumen.cantidadEfectivo})</span>
                        <span className={estilos.resumenValor}>{formatearMoneda(resumen.totalEfectivo)}</span>
                    </div>
                </div>

                <div className={`${estilos.resumenCard} ${estilos.resumenCredito}`}>
                    <div className={`${estilos.resumenIcono} ${estilos.credito}`}>
                        <ion-icon name="card-outline"></ion-icon>
                    </div>
                    <div className={estilos.resumenInfo}>
                        <span className={estilos.resumenLabel}>{t('ventas.credito')} ({resumen.cantidadCredito})</span>
                        <span className={estilos.resumenValor}>{formatearMoneda(resumen.totalCredito)}</span>
                    </div>
                </div>
            </div>

            {/* ========== FILTROS RÁPIDOS (PERÍODO) ========== */}
            <div className={estilos.filtrosRapidos}>
                <div className={`${estilos.chipsCarruselWrap} ${estilos.chipsCarruselMetodo}`}>
                    {vistaMovil && controlesCarrusel.metodo.mostrar && controlesCarrusel.metodo.izquierda && (
                        <button
                            type="button"
                            className={`${estilos.btnCarrusel} ${estilos.btnCarruselIzq}`}
                            onClick={() => desplazarCarrusel('metodo', 'izquierda')}
                            aria-label={tr('Desplazar métodos a la izquierda', 'Scroll methods left')}
                        >
                            <ion-icon name="chevron-back-outline"></ion-icon>
                        </button>
                    )}

                    <div
                        className={estilos.chipsMetodo}
                        ref={chipsMetodoRef}
                        onScroll={() => manejarScrollCarrusel('metodo')}
                    >
                        <button
                            className={`${estilos.chip} ${filtrosAvanzados.metodo === '' ? estilos.chipActivo : ''}`}
                            onClick={() => setFiltrosAvanzados({ ...filtrosAvanzados, metodo: '' })}
                        >
                            {t('ventas.todosMetodos')}
                        </button>
                        <button
                            className={`${estilos.chip} ${estilos.chipEfectivo} ${filtrosAvanzados.metodo === 'efectivo' ? estilos.chipActivo : ''}`}
                            onClick={() => setFiltrosAvanzados({ ...filtrosAvanzados, metodo: filtrosAvanzados.metodo === 'efectivo' ? '' : 'efectivo' })}
                        >
                            <ion-icon name="cash-outline"></ion-icon>
                            {t('ventas.efectivo')}
                        </button>
                        <button
                            className={`${estilos.chip} ${estilos.chipCredito} ${filtrosAvanzados.metodo === 'credito' ? estilos.chipActivo : ''}`}
                            onClick={() => setFiltrosAvanzados({ ...filtrosAvanzados, metodo: filtrosAvanzados.metodo === 'credito' ? '' : 'credito' })}
                        >
                            <ion-icon name="card-outline"></ion-icon>
                            {t('ventas.credito')}
                        </button>
                    </div>

                    {vistaMovil && controlesCarrusel.metodo.mostrar && controlesCarrusel.metodo.derecha && (
                        <button
                            type="button"
                            className={`${estilos.btnCarrusel} ${estilos.btnCarruselDer}`}
                            onClick={() => desplazarCarrusel('metodo', 'derecha')}
                            aria-label={tr('Desplazar métodos a la derecha', 'Scroll methods right')}
                        >
                            <ion-icon name="chevron-forward-outline"></ion-icon>
                        </button>
                    )}
                </div>
                <div className={`${estilos.chipsCarruselWrap} ${estilos.chipsCarruselPeriodo}`}>
                    {vistaMovil && controlesCarrusel.periodo.mostrar && controlesCarrusel.periodo.izquierda && (
                        <button
                            type="button"
                            className={`${estilos.btnCarrusel} ${estilos.btnCarruselIzq}`}
                            onClick={() => desplazarCarrusel('periodo', 'izquierda')}
                            aria-label={tr('Desplazar períodos a la izquierda', 'Scroll periods left')}
                        >
                            <ion-icon name="chevron-back-outline"></ion-icon>
                        </button>
                    )}

                    <div
                        className={estilos.chipsPeriodo}
                        ref={chipsPeriodoRef}
                        onScroll={() => manejarScrollCarrusel('periodo')}
                    >
                        <button
                            className={`${estilos.chip} ${periodo === 'hoy' ? estilos.chipActivo : ''}`}
                            onClick={() => setPeriodo('hoy')}
                        >
                            {t('ventas.hoy')}
                        </button>
                        <button
                            className={`${estilos.chip} ${periodo === 'semana' ? estilos.chipActivo : ''}`}
                            onClick={() => setPeriodo('semana')}
                        >
                            {t('ventas.semana')}
                        </button>
                        <button
                            className={`${estilos.chip} ${periodo === 'mes' ? estilos.chipActivo : ''}`}
                            onClick={() => setPeriodo('mes')}
                        >
                            {t('ventas.mes')}
                        </button>
                        <button
                            className={`${estilos.chip} ${periodo === 'personalizado' ? estilos.chipActivo : ''}`}
                            onClick={() => setPeriodo('personalizado')}
                        >
                            <ion-icon name="calendar-outline"></ion-icon>
                            {t('ventas.rango')}
                        </button>
                    </div>

                    {vistaMovil && controlesCarrusel.periodo.mostrar && controlesCarrusel.periodo.derecha && (
                        <button
                            type="button"
                            className={`${estilos.btnCarrusel} ${estilos.btnCarruselDer}`}
                            onClick={() => desplazarCarrusel('periodo', 'derecha')}
                            aria-label={tr('Desplazar períodos a la derecha', 'Scroll periods right')}
                        >
                            <ion-icon name="chevron-forward-outline"></ion-icon>
                        </button>
                    )}
                </div>

                <div className={estilos.toggleCaja}>
                    <label className={estilos.switchRow}>
                        <span>{t('ventas.soloCajaAbierta')}</span>
                        <span className={estilos.switchControl}>
                            <input
                                type="checkbox"
                                checked={soloCajaAbierta}
                                onChange={(e) => setSoloCajaAbierta(e.target.checked)}
                                className={estilos.switchInput}
                            />
                            <span className={estilos.switchSlider}></span>
                        </span>
                    </label>
                </div>

                <div className={estilos.infoFiltrosActivos}>
                    <div className={estilos.infoFiltroItem}>
                        <span className={estilos.infoFiltroLabel}>{t('ventas.metodo')}</span>
                        <span className={estilos.infoFiltroValor}>{metodoActivoTexto}</span>
                    </div>
                    <div className={estilos.infoFiltroItem}>
                        <span className={estilos.infoFiltroLabel}>{t('ventas.periodo')}</span>
                        <span className={estilos.infoFiltroValor}>{rangoActivo.etiqueta}</span>
                    </div>
                    <div className={estilos.infoFiltroItem}>
                        <span className={estilos.infoFiltroLabel}>{t('ventas.rangoAplicado')}</span>
                        <span className={estilos.infoFiltroValor}>
                            {rangoActivo.desde && rangoActivo.hasta
                                ? `${formatearFechaVisual(rangoActivo.desde)} - ${formatearFechaVisual(rangoActivo.hasta)}`
                                : t('ventas.seleccionarFechas')}
                        </span>
                    </div>
                    <div className={estilos.infoFiltroItem}>
                        <span className={estilos.infoFiltroLabel}>{t('ventas.resultados')}</span>
                        <span className={estilos.infoFiltroValor}>{totalVentas} {t('ventas.resultadosVentas')}</span>
                    </div>
                </div>
            </div>

            {/* ========== RANGO PERSONALIZADO ========== */}
            {periodo === 'personalizado' && (
                <div className={estilos.rangoPers}>
                    <div className={estilos.grupoFecha}>
                        <label>{t('ventas.desde')}</label>
                        <input
                            type="date"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            className={estilos.inputFecha}
                        />
                    </div>
                    <div className={estilos.grupoFecha}>
                        <label>{t('ventas.hasta')}</label>
                        <input
                            type="date"
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                            className={estilos.inputFecha}
                            min={fechaInicio || undefined}
                        />
                    </div>
                    <div className={estilos.ayudaRango}>
                        <ion-icon name="information-circle-outline"></ion-icon>
                        <span>{t('ventas.rangoInfo')}</span>
                    </div>
                </div>
            )}

            {/* ========== BÚSQUEDA Y FILTROS AVANZADOS ========== */}
            <div className={estilos.barraBusqueda}>
                <div className={estilos.busqueda}>
                    <ion-icon name="search-outline"></ion-icon>
                    <input
                        type="text"
                        placeholder={tr('Buscar por número, cliente o vendedor...', 'Search by number, customer or seller...')}
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
                    <span>{t('ventas.filtros')}</span>
                </button>
            </div>

            {/* ========== PANEL DE FILTROS AVANZADOS ========== */}
            {mostrarFiltros && (
                    <div className={estilos.filtrosAvanzados}>
                    <div className={estilos.filtrosGrid}>
                        <div className={estilos.grupoFiltro}>
                            <label>{t('ventas.estado')}</label>
                            <select
                                value={filtrosAvanzados.estado}
                                onChange={(e) => setFiltrosAvanzados({ ...filtrosAvanzados, estado: e.target.value })}
                                className={estilos.selectFiltro}
                            >
                                <option value="">{t('ventas.todosMetodos')}</option>
                                <option value="emitida">{t('ventas.emitida')}</option>
                                <option value="anulada">{t('ventas.anulada')}</option>
                                <option value="pendiente">{t('ventas.pendiente')}</option>
                            </select>
                        </div>

                        <div className={estilos.grupoFiltro}>
                            <label>{t('ventas.metodoPago')}</label>
                            <select
                                value={filtrosAvanzados.metodo}
                                onChange={(e) => setFiltrosAvanzados({ ...filtrosAvanzados, metodo: e.target.value })}
                                className={estilos.selectFiltro}
                            >
                                <option value="">{t('ventas.todosMetodos')}</option>
                                <option value="efectivo">{t('ventas.efectivo')}</option>
                                <option value="tarjeta_debito">{tr('Tarjeta Débito', 'Debit Card')}</option>
                                <option value="tarjeta_credito">{tr('Tarjeta Crédito', 'Credit Card')}</option>
                                <option value="transferencia">{tr('Transferencia', 'Transfer')}</option>
                                <option value="cheque">{tr('Cheque', 'Check')}</option>
                                <option value="credito">{t('ventas.credito')}</option>
                            </select>
                        </div>

                        <div className={estilos.grupoFiltro}>
                            <label>{t('ventas.montoMinimo')}</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={filtrosAvanzados.minTotal}
                                onChange={(e) => setFiltrosAvanzados({ ...filtrosAvanzados, minTotal: e.target.value })}
                                placeholder={`${datosEmpresa?.simbolo_moneda || 'RD$'} 0.00`}
                                className={estilos.inputFiltro}
                            />
                        </div>

                        <div className={estilos.grupoFiltro}>
                            <label>{t('ventas.montoMaximo')}</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={filtrosAvanzados.maxTotal}
                                onChange={(e) => setFiltrosAvanzados({ ...filtrosAvanzados, maxTotal: e.target.value })}
                                placeholder={`${datosEmpresa?.simbolo_moneda || 'RD$'} 0.00`}
                                className={estilos.inputFiltro}
                            />
                        </div>
                    </div>

                    <div className={estilos.filtrosAcciones}>
                        <button
                            className={estilos.btnLimpiar}
                            onClick={limpiarFiltrosAvanzados}
                        >
                            {t('ventas.limpiar')}
                        </button>
                        <button
                            className={estilos.btnAplicar}
                            onClick={() => {
                                setPaginaActual(1)
                                cargarVentas(1)
                                if (vistaMovil) setMostrarFiltros(false)
                            }}
                        >
                            {t('ventas.aplicar')}
                        </button>
                    </div>
                </div>
            )}

            {/* ========== LISTA DE VENTAS ========== */}
            {cargando ? <LoadingScreen /> : ventas.length === 0 ? (
                <div className={estilos.vacio}>
                    <ion-icon name="receipt-outline"></ion-icon>
                    <span>{t('ventas.sinVentas')}</span>
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
                                        <span className={estilos.numeroCaja}>{venta.ncf || t('ventas.sinNcf')}</span>
                                    </div>
                                    <span className={estilos.cardMonto}>{formatearMoneda(venta.total)}</span>
                                </div>

                                <div className={estilos.cardBody}>
                                    <div className={estilos.cardRow}>
                                        <span className={estilos.cardLabel}>{t('ventas.cliente')}</span>
                                        <span className={estilos.cardValue}>{venta.cliente_nombre || t('ventas.consumidorFinal')}</span>
                                    </div>
                                    <div className={estilos.cardRow}>
                                        <span className={estilos.cardLabel}>{t('ventas.vendedor')}</span>
                                        <span className={estilos.cardValue}>{venta.vendedor_nombre || t('ventas.nA')}</span>
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
                                                {venta.estado === 'emitida' ? t('ventas.emitida') : venta.estado === 'anulada' ? t('ventas.anulada') : t('ventas.pendiente')}
                                            </span>
                                            {tieneDespachoPendiente && (
                                                <span className={`${estilos.badge} ${estilos.despachoPendiente}`}>
                                                    {t('ventas.despPend')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className={estilos.cardAcciones}>
                                    <Link href={`${basePath}/ventas/ver/${venta.id}`} className={estilos.btnIcono} title={t('ventas.ver')}>
                                        <ion-icon name="eye-outline"></ion-icon>
                                    </Link>
                                    <Link href={`${basePath}/ventas/imprimir/${venta.id}`} className={`${estilos.btnIcono} ${estilos.imprimir}`} title={t('ventas.imprimir')}>
                                        <ion-icon name="print-outline"></ion-icon>
                                    </Link>
                                    {tieneDespachoPendiente && (
                                        <Link href={`/admin/conduces/crear?origen=venta&numero=${venta.numero_interno}`} className={`${estilos.btnIcono} ${estilos.despachar}`} title={t('ventas.despachar')}>
                                            <ion-icon name="cube-outline"></ion-icon>
                                        </Link>
                                    )}
                                    {venta.estado === 'emitida' && (
                                        <button
                                            className={`${estilos.btnIcono} ${estilos.anular}`}
                                            onClick={() => manejarAnularVenta(venta.id, venta.numero_interno)}
                                            disabled={procesando}
                                            title={t('ventas.anular')}
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
                                <th>{t('ventas.numTab')}</th>
                                <th>{t('ventas.ncfTab')}</th>
                                <th>{t('ventas.cajaTab')}</th>
                                <th>{t('ventas.clienteTab')}</th>
                                <th>{t('ventas.vendedorTab')}</th>
                                <th>{t('ventas.metodoTab')}</th>
                                <th>{t('ventas.dgiiTab')}</th>
                                <th>{t('ventas.totalTab')}</th>
                                <th>{t('ventas.estadoTab')}</th>
                                <th>{t('ventas.accionesTab')}</th>
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
                                        <td>{venta.numero_caja ? `#${venta.numero_caja}` : t('ventas.nA')}</td>
                                        <td>{venta.cliente_nombre || t('ventas.consumidorFinal')}</td>
                                        <td>{venta.vendedor_nombre || t('ventas.nA')}</td>
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
                                                    {venta.estado === 'emitida' ? t('ventas.emitida') : venta.estado === 'anulada' ? t('ventas.anulada') : t('ventas.pendiente')}
                                                </span>
                                                {tieneDespachoPendiente && (
                                                    <span className={`${estilos.badge} ${estilos.despachoPendiente}`}>
                                                        {t('ventas.despPend')}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className={estilos.accionesTabla}>
                                                <Link href={`${basePath}/ventas/ver/${venta.id}`} className={estilos.btnIcono} title={t('ventas.ver')}>
                                                    <ion-icon name="eye-outline"></ion-icon>
                                                </Link>
                                                <Link href={`${basePath}/ventas/imprimir/${venta.id}`} className={`${estilos.btnIcono} ${estilos.imprimir}`} title={t('ventas.imprimir')}>
                                                    <ion-icon name="print-outline"></ion-icon>
                                                </Link>
                                                {tieneDespachoPendiente && (
                                                    <Link href={`/admin/conduces/crear?origen=venta&numero=${venta.numero_interno}`} className={`${estilos.btnIcono} ${estilos.despachar}`} title={t('ventas.despachar')}>
                                                        <ion-icon name="cube-outline"></ion-icon>
                                                    </Link>
                                                )}
                                                {venta.estado === 'emitida' && (
                                                    <button
                                                        className={`${estilos.btnIcono} ${estilos.anular}`}
                                                        onClick={() => manejarAnularVenta(venta.id, venta.numero_interno)}
                                                        disabled={procesando}
                                                        title={t('ventas.anular')}
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
                            {t('ventas.mostrando')} {(paginaActual - 1) * limite + 1}-{Math.min(paginaActual * limite, totalVentas)} {tr('de', 'of')} {totalVentas} {t('ventas.resultadosVentas')}
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
                            <h2>{t('ventas.abrirCajaModal')}</h2>
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
                                <p>{t('ventas.abrirCajaInfo')}</p>
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>{t('ventas.montoInicialLabel')} ({datosEmpresa?.simbolo_moneda || 'RD$'})</label>
                                <div className={estilos.inputMoneda}>
                                    <span className={estilos.simboloMoneda}>{datosEmpresa?.simbolo_moneda || 'RD$'}</span>
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
                                    {t('ventas.cancelar')}
                                </button>
                                <button
                                    type="submit"
                                    className={estilos.btnGuardar}
                                    disabled={procesando}
                                >
                                    {procesando ? t('ventas.abriendo') : t('ventas.abrirCajaModal')}
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
                            <h2>{t('ventas.cerrarCajaModal')}</h2>
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
                                <p>{t('ventas.cerrarCajaInfo')}</p>
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>{t('ventas.efectivoCajaLabel')} ({datosEmpresa?.simbolo_moneda || 'RD$'})</label>
                                <div className={estilos.inputMoneda}>
                                    <span className={estilos.simboloMoneda}>{datosEmpresa?.simbolo_moneda || 'RD$'}</span>
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
                                    {t('ventas.cancelar')}
                                </button>
                                <button
                                    type="submit"
                                    className={estilos.btnGuardar}
                                    style={{ background: 'var(--danger)', color: 'white' }}
                                    disabled={procesando}
                                >
                                    {procesando ? t('ventas.cerrando') : t('ventas.cerrarCajaModal')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}