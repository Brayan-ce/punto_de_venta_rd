"use client"
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);
const ZONA_HORARIA_LOCAL = process.env.NEXT_PUBLIC_ZONA_HORARIA_LOCAL || 'America/Santo_Domingo';
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
    obtenerTodasLasCajas,
    obtenerDatosEmpresa
} from './servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './caja.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function CajaPageAdmin() {
                // Estado para recordar si el usuario ocultó la alerta manualmente
                const [alertaCajaViejaOculta, setAlertaCajaViejaOculta] = useState(false);
                const { language } = useLanguage()
                const tr = (es, en) => (language === 'en' ? en : es)
            // Estado para debug visual
            const [debugAntigua, setDebugAntigua] = useState(false);
        // Utilidad para saber si la caja es antigua
function esCajaAntigua(fechaCaja) {
    if (!fechaCaja) return false;
    // Tomar solo los primeros 10 chars: "2026-02-23"
    // Sin importar si llega como string o Date object, evitamos la conversión de timezone
    const fechaCajaStr = typeof fechaCaja === 'string'
        ? fechaCaja.slice(0, 10)
        : dayjs(fechaCaja).utc().format('YYYY-MM-DD');
    const fechaHoyLocal = dayjs().tz(ZONA_HORARIA_LOCAL).format('YYYY-MM-DD');
    return fechaCajaStr !== fechaHoyLocal;
}
    const router = useRouter();
    const [tema, setTema] = useState('light');
    const [cargando, setCargando] = useState(true);
    const [procesando, setProcesando] = useState(false);
    const [userTipo, setUserTipo] = useState('');
    const [cajaActiva, setCajaActiva] = useState(null);
    const [cajasDisponibles, setCajasDisponibles] = useState([]);
    const [ventasCaja, setVentasCaja] = useState([]);
    const [todasLasCajas, setTodasLasCajas] = useState([]);
    const [historial, setHistorial] = useState([]);
    const [paginaHistorial, setPaginaHistorial] = useState(1);
    const HISTORIAL_POR_PAGINA = 20;
    const [vistaActual, setVistaActual] = useState('dashboard');
    const [mostrarModalAbrir, setMostrarModalAbrir] = useState(false);
    const [mostrarModalGasto, setMostrarModalGasto] = useState(false);
    const [mostrarModalCerrar, setMostrarModalCerrar] = useState(false);
    const [mostrarAlertaCajaVieja, setMostrarAlertaCajaVieja] = useState(false);
    const [formAbrir, setFormAbrir] = useState({ numero_caja: '', monto_inicial: '' });
    const [formGasto, setFormGasto] = useState({ concepto: '', monto: '', categoria: '', comprobante_numero: '', notas: '' });
    const [formCerrar, setFormCerrar] = useState({ monto_final: '', notas: '', metodo_pago_cierre: 'efectivo' });
    const [empresa, setEmpresa] = useState(null);

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
        cargarEmpresa()
        setPaginaHistorial(1) // Reinicia a la página 1 cuando cambia la vista
    }, [vistaActual])

    const cargarEmpresa = async () => {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresa(res.empresa)
    }

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
        // Si cambia la caja activa, reiniciar el ocultamiento manual
        setAlertaCajaViejaOculta(false);
        const antigua = esCajaAntigua(cajaActiva.fecha_caja);
        setMostrarAlertaCajaVieja(antigua);
        setDebugAntigua(antigua);
    } else {
        setMostrarAlertaCajaVieja(false);
        setDebugAntigua(false);
    }
}, [cajaActiva]);
useEffect(() => {
    console.log('🔍 DEBUG ALERTA:', {
        tieneCajaActiva: !!cajaActiva,
        fechaCaja: cajaActiva?.fecha_caja,
        fechaCajaISO: cajaActiva?.fecha_caja ? dayjs(cajaActiva.fecha_caja).tz(ZONA_HORARIA_LOCAL).format('YYYY-MM-DD') : null,
        fechaHoyISO: dayjs().tz(ZONA_HORARIA_LOCAL).format('YYYY-MM-DD'),
        sonIguales: cajaActiva?.fecha_caja ? (dayjs(cajaActiva.fecha_caja).tz(ZONA_HORARIA_LOCAL).format('YYYY-MM-DD') === dayjs().tz(ZONA_HORARIA_LOCAL).format('YYYY-MM-DD')) : null,
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
            alert(tr('Completa todos los campos obligatorios', 'Complete all required fields'))
            return
        }

        if (parseFloat(formAbrir.monto_inicial) < 0) {
            alert(tr('El monto inicial debe ser mayor o igual a cero', 'Initial amount must be greater than or equal to zero'))
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
            alert(tr('Error al abrir caja', 'Error opening register'))
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
        if (mostrarAlertaCajaVieja) {
            // Si la caja es antigua, forzar la alerta visible y hacer scroll a la alerta
            setAlertaCajaViejaOculta(false); // Por si el usuario la ocultó antes
            setMostrarAlertaCajaVieja(true);
            // Intentar hacer scroll a la alerta si existe un ref
            const alerta = document.getElementById('alerta-caja-vieja');
            if (alerta) {
                alerta.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }
        setMostrarModalGasto(true);
    }

    const manejarRegistrarGasto = async (e) => {
        e.preventDefault()

        if (!formGasto.concepto || !formGasto.monto) {
            alert(tr('Completa los campos obligatorios', 'Complete required fields'))
            return
        }

        if (parseFloat(formGasto.monto) <= 0) {
            alert(tr('El monto debe ser mayor a cero', 'Amount must be greater than zero'))
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
            alert(tr('Error al registrar gasto', 'Error recording expense'))
        } finally {
            setProcesando(false)
        }
    }

    const abrirModalCerrar = () => {
        setFormCerrar({
            monto_final: '',
            notas: '',
            metodo_pago_cierre: 'efectivo'
        })
        setMostrarModalCerrar(true)
    }

    const manejarCerrarCaja = async (e) => {
        e.preventDefault()


        if (!formCerrar.monto_final) {
            alert(tr('Ingresa el monto final de caja', 'Enter the final register amount'))
            return
        }
        if (!formCerrar.metodo_pago_cierre) {
            alert(tr('Selecciona el método de pago principal', 'Select the main payment method'))
            return
        }

        if (parseFloat(formCerrar.monto_final) < 0) {
            alert(tr('El monto final debe ser mayor o igual a cero', 'Final amount must be greater than or equal to zero'))
            return
        }

        const esperado = parseFloat(cajaActiva.monto_inicial || 0) +
            parseFloat(cajaActiva.total_ventas || 0) -
            parseFloat(cajaActiva.total_gastos || 0)

        const diferencia = parseFloat(formCerrar.monto_final) - esperado

        const confirmar = window.confirm(
            diferencia === 0
                ? tr('¿Confirmas el cierre de caja? El monto cuadra perfectamente.', 'Confirm register closing? The amount balances perfectly.')
                : (language === 'en'
                    ? `Confirm register closing? There is a difference of ${formatearMoneda(Math.abs(diferencia))} ${diferencia > 0 ? 'in your favor' : 'against'}.`
                    : `¿Confirmas el cierre de caja? Hay una diferencia de ${formatearMoneda(Math.abs(diferencia))} ${diferencia > 0 ? 'a favor' : 'en contra'}.`)
        )

        if (!confirmar) return

        setProcesando(true)
        try {
            const resultado = await cerrarCaja({
                caja_id: cajaActiva.id,
                monto_final: parseFloat(formCerrar.monto_final),
                notas: formCerrar.notas.trim() || null,
                metodo_pago_cierre: formCerrar.metodo_pago_cierre
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
            alert(tr('Error al cerrar caja', 'Error closing register'))
        } finally {
            setProcesando(false)
        }
    }

    const formatearMoneda = (monto) => {
        const locale = language === 'en' ? 'en-US' : (empresa?.locale || 'es-DO')
        const moneda = empresa?.moneda || 'DOP'
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: moneda,
            minimumFractionDigits: 2
        }).format(monto)
    }

    const formatearFecha = (fecha) => {
        const locale = language === 'en' ? 'en-US' : (empresa?.locale || 'es-DO')
        return new Date(fecha).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const formatearHora = (fecha) => {
        const locale = language === 'en' ? 'en-US' : (empresa?.locale || 'es-DO')
        return new Date(fecha).toLocaleTimeString(locale, {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (cargando) {
        return <LoadingScreen />
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}> 
            {/* Alerta de caja antigua */}
            {mostrarAlertaCajaVieja && !alertaCajaViejaOculta && (
                <div id="alerta-caja-vieja" className={estilos.alertaCajaVieja}>
                    <span className={estilos.alertaCajaViejaIcono}>
                        <ion-icon name="alert-circle-outline"></ion-icon>
                    </span>
                    <div>
                        <div className={estilos.alertaCajaViejaTitulo}>{tr('Caja antigua detectada', 'Old register detected')}</div>
                        <div className={estilos.alertaCajaViejaTexto}>
                            {tr('No puedes registrar gastos ni cerrar una caja de un día anterior.', 'You cannot record expenses or close a register from a previous day.')}<br/>
                            <span className={estilos.alertaCajaViejaResalta}>{tr('Por favor, cierra la caja y abre una nueva para continuar.', 'Please close the register and open a new one to continue.')}</span>
                        </div>
                    </div>
                    <button className={estilos.btnAlertaCerrar} onClick={() => setAlertaCajaViejaOculta(true)} title="Ocultar alerta">
                        <ion-icon name="close-outline"></ion-icon>
                    </button>
                </div>
            )}
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>{tr('Caja', 'Register')}</h1>
                    <p className={estilos.subtitulo}>{tr('Gestiona tus cajas y turnos', 'Manage your registers and shifts')}</p>
                </div>
            </div>

            <div className={estilos.tabs}>
                <button
                    className={`${estilos.tab} ${vistaActual === 'dashboard' ? estilos.tabActiva : ''}`}
                    onClick={() => setVistaActual('dashboard')}
                >
                    <ion-icon name="calculator-outline"></ion-icon>
                    <span>{tr('Mi Caja', 'My Register')}</span>
                </button>
                <button
                    className={`${estilos.tab} ${vistaActual === 'historial' ? estilos.tabActiva : ''}`}
                    onClick={() => setVistaActual('historial')}
                >
                    <ion-icon name="time-outline"></ion-icon>
                    <span>{tr('Historial', 'History')}</span>
                </button>
                {userTipo === 'admin' && (
                    <button
                        className={`${estilos.tab} ${vistaActual === 'todas' ? estilos.tabActiva : ''}`}
                        onClick={() => setVistaActual('todas')}
                    >
                        <ion-icon name="grid-outline"></ion-icon>
                        <span>{tr('Todas las Cajas', 'All Registers')}</span>
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
                                        <span className={estilos.cajaNumero}>{tr('Caja', 'Register')} {cajaActiva.numero_caja}</span>
                                        <span className={estilos.cajaEstado}>{tr('Abierta', 'Open')}</span>
                                    </div>
                                </div>
                                <div className={estilos.cajaAcciones}>
                                    <button onClick={abrirModalGasto} className={estilos.btnGasto}>
                                        <ion-icon name="remove-circle-outline"></ion-icon>
                                        <span>{tr('Registrar Gasto', 'Record Expense')}</span>
                                    </button>
                                    <button onClick={abrirModalCerrar} className={estilos.btnCerrar}>
                                        <ion-icon name="lock-closed-outline"></ion-icon>
                                        <span>{tr('Cerrar Caja', 'Close Register')}</span>
                                    </button>
                                </div>
                            </div>

                            <div className={estilos.estadisticasGrid}>
                                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                                    <div className={estilos.estadIcono}>
                                        <ion-icon name="wallet-outline"></ion-icon>
                                    </div>
                                    <div className={estilos.estadInfo}>
                                        <span className={estilos.estadLabel}>{tr('Monto Inicial', 'Initial Amount')}</span>
                                        <span
                                            className={estilos.estadValor}>{formatearMoneda(cajaActiva.monto_inicial)}</span>
                                    </div>
                                </div>

                                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                                    <div className={`${estilos.estadIcono} ${estilos.success}`}>
                                        <ion-icon name="trending-up-outline"></ion-icon>
                                    </div>
                                    <div className={estilos.estadInfo}>
                                        <span className={estilos.estadLabel}>{tr('Ventas del Dia', 'Daily Sales')}</span>
                                        <span
                                            className={estilos.estadValor}>{formatearMoneda(cajaActiva.total_ventas)}</span>
                                    </div>
                                </div>

                                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                                    <div className={`${estilos.estadIcono} ${estilos.danger}`}>
                                        <ion-icon name="arrow-down-outline"></ion-icon>
                                    </div>
                                    <div className={estilos.estadInfo}>
                                        <span className={estilos.estadLabel}>{tr('Gastos', 'Expenses')}</span>
                                        <span
                                            className={estilos.estadValor}>{formatearMoneda(cajaActiva.total_gastos)}</span>
                                    </div>
                                </div>

                                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                                    <div className={`${estilos.estadIcono} ${estilos.primary}`}>
                                        <ion-icon name="cash-outline"></ion-icon>
                                    </div>
                                    <div className={estilos.estadInfo}>
                                        <span className={estilos.estadLabel}>{tr('Total en Caja', 'Total in Register')}</span>
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
                                    <h2 className={estilos.panelTitulo}>{tr('Desglose por Metodo de Pago', 'Breakdown by Payment Method')}</h2>
                                    <div className={estilos.metodosList}>
                                        <div className={estilos.metodoItem}>
                                            <div className={estilos.metodoInfo}>
                                                <ion-icon name="cash-outline"></ion-icon>
                                                <span>{tr('Efectivo', 'Cash')}</span>
                                            </div>
                                            <span
                                                className={estilos.metodoMonto}>{formatearMoneda(cajaActiva.total_efectivo)}</span>
                                        </div>
                                        <div className={estilos.metodoItem}>
                                            <div className={estilos.metodoInfo}>
                                                <ion-icon name="card-outline"></ion-icon>
                                                <span>{tr('Tarjeta Debito', 'Debit Card')}</span>
                                            </div>
                                            <span
                                                className={estilos.metodoMonto}>{formatearMoneda(cajaActiva.total_tarjeta_debito)}</span>
                                        </div>
                                        <div className={estilos.metodoItem}>
                                            <div className={estilos.metodoInfo}>
                                                <ion-icon name="card-outline"></ion-icon>
                                                <span>{tr('Tarjeta Credito', 'Credit Card')}</span>
                                            </div>
                                            <span
                                                className={estilos.metodoMonto}>{formatearMoneda(cajaActiva.total_tarjeta_credito)}</span>
                                        </div>
                                        <div className={estilos.metodoItem}>
                                            <div className={estilos.metodoInfo}>
                                                <ion-icon name="sync-outline"></ion-icon>
                                                <span>{tr('Transferencia', 'Transfer')}</span>
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
                                    <h2 className={estilos.panelTitulo}>{tr('Informacion del Turno', 'Shift Information')}</h2>
                                    <div className={estilos.infoGrid}>
                                        <div className={estilos.infoItem}>
                                            <span className={estilos.infoLabel}>{tr('Fecha', 'Date')}</span>
                                            <span
                                                className={estilos.infoValor}>{formatearFecha(cajaActiva.fecha_apertura)}</span>
                                        </div>
                                        <div className={estilos.infoItem}>
                                            <span className={estilos.infoLabel}>{tr('Hora Apertura', 'Opening Time')}</span>
                                            <span
                                                className={estilos.infoValor}>{formatearHora(cajaActiva.fecha_apertura)}</span>
                                        </div>
                                        <div className={estilos.infoItem}>
                                            <span className={estilos.infoLabel}>{tr('Ventas Realizadas', 'Sales Made')}</span>
                                            <span className={estilos.infoValor}>{ventasCaja.length}</span>
                                        </div>
                                        <div className={estilos.infoItem}>
                                            <span className={estilos.infoLabel}>{tr('Estado', 'Status')}</span>
                                            <span className={`${estilos.badge} ${estilos.activo}`}>{tr('Abierta', 'Open')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {ventasCaja.length > 0 && (
                                <div className={`${estilos.panel} ${estilos[tema]}`}>
                                    <h2 className={estilos.panelTitulo}>{tr('Ventas del Turno', 'Shift Sales')} ({ventasCaja.length})</h2>
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
                            <h2>{tr('No tienes una caja abierta', 'You have no open register')}</h2>
                            <p>{tr('Abre una caja para comenzar a registrar ventas', 'Open a register to start recording sales')}</p>
                            {cajasDisponibles.length > 0 ? (
                                <button onClick={abrirModalAbrir} className={estilos.btnAbrirCaja}>
                                    <ion-icon name="add-circle-outline"></ion-icon>
                                    <span>{tr('Abrir Caja', 'Open Register')}</span>
                                </button>
                            ) : (
                                <p className={estilos.noDisponibles}>{tr('No hay cajas disponibles. Todas estan en uso.', 'No registers available. All are in use.')}</p>
                            )}
                        </div>
                    )}
                </>
            )}

            {vistaActual === 'historial' && (
                <div className={`${estilos.panel} ${estilos[tema]}`}>
                    <h2 className={estilos.panelTitulo}>{tr('Historial de Cajas', 'Register History')}</h2>
                    {historial.length === 0 ? (
                        <div className={estilos.vacio}>
                            <ion-icon name="document-outline"></ion-icon>
                            <span>{tr('No hay historial de cajas', 'No register history')}</span>
                        </div>
                    ) : (
                        <>
                            <div className={estilos.historialList}>
                                {historial
                                    .slice((paginaHistorial - 1) * HISTORIAL_POR_PAGINA, paginaHistorial * HISTORIAL_POR_PAGINA)
                                    .map((caja) => (
                                        <div key={caja.id} className={`${estilos.historialItem} ${estilos[tema]}`}>
                                            <div className={estilos.historialHeader}>
                                                <div>
                                                    <span className={estilos.historialCaja}>{tr('Caja', 'Register')} {caja.numero_caja}</span>
                                                    <span className={estilos.historialFecha}>{formatearFecha(caja.fecha_caja)}</span>
                                                </div>
                                                <span className={`${estilos.badge} ${caja.estado === 'abierta' ? estilos.activo : estilos.inactivo}`}>
                                                    {caja.estado}
                                                </span>
                                            </div>
                                            <div className={estilos.historialDetalles}>
                                                <div className={estilos.historialStat}>
                                                    <span className={estilos.historialLabel}>{tr('Monto Inicial', 'Initial Amount')}</span>
                                                    <span className={estilos.historialValor}>{formatearMoneda(caja.monto_inicial)}</span>
                                                </div>
                                                <div className={estilos.historialStat}>
                                                    <span className={estilos.historialLabel}>{tr('Ventas', 'Sales')}</span>
                                                    <span className={estilos.historialValor}>{formatearMoneda(caja.total_ventas)}</span>
                                                </div>
                                                <div className={estilos.historialStat}>
                                                    <span className={estilos.historialLabel}>{tr('Gastos', 'Expenses')}</span>
                                                    <span className={estilos.historialValor}>{formatearMoneda(caja.total_gastos)}</span>
                                                </div>
                                                {caja.estado === 'cerrada' && (
                                                    <>
                                                        <div className={estilos.historialStat}>
                                                            <span className={estilos.historialLabel}>{tr('Esperado', 'Expected')}</span>
                                                            <span className={estilos.historialValor}>
                                                                {formatearMoneda(
                                                                    parseFloat(caja.monto_inicial || 0) +
                                                                    parseFloat(caja.total_ventas || 0) -
                                                                    parseFloat(caja.total_gastos || 0)
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className={estilos.historialStat}>
                                                            <span className={estilos.historialLabel}>{tr('Real', 'Actual')}</span>
                                                            <span className={estilos.historialValor}>{formatearMoneda(caja.monto_final)}</span>
                                                        </div>
                                                        <div className={estilos.historialStat}>
                                                            <span className={estilos.historialLabel}>{tr('Diferencia', 'Difference')}</span>
                                                            <span className={`${estilos.historialValor} ${parseFloat(caja.diferencia || 0) === 0 ? estilos.success : estilos.danger}`}>
                                                                {formatearMoneda(caja.diferencia)}
                                                            </span>
                                                        </div>
                                                        <div className={estilos.historialStat}>
                                                            <span className={estilos.historialLabel}>{tr('Método de Pago Cierre', 'Closing Payment Method')}</span>
                                                            <span className={estilos.historialValor}>{
                                                                !caja.metodo_pago_cierre || caja.metodo_pago_cierre === '-' ? 'efectivo' : caja.metodo_pago_cierre
                                                            }</span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                            {/* Controles de paginación */}
                            {historial.length > HISTORIAL_POR_PAGINA && (
                                <div className={estilos.paginacionHistorial}>
                                    <button
                                        className={estilos.btnPaginacion}
                                        onClick={() => setPaginaHistorial((p) => Math.max(1, p - 1))}
                                        disabled={paginaHistorial === 1}
                                    >
                                        {tr('Anterior', 'Previous')}
                                    </button>
                                    <span className={estilos.paginacionPagina}>
                                        {tr('Página', 'Page')} {paginaHistorial} {tr('de', 'of')} {Math.ceil(historial.length / HISTORIAL_POR_PAGINA)}
                                    </span>
                                    <button
                                        className={estilos.btnPaginacion}
                                        onClick={() => setPaginaHistorial((p) => Math.min(Math.ceil(historial.length / HISTORIAL_POR_PAGINA), p + 1))}
                                        disabled={paginaHistorial === Math.ceil(historial.length / HISTORIAL_POR_PAGINA)}
                                    >
                                        {tr('Siguiente', 'Next')}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {vistaActual === 'todas' && userTipo === 'admin' && (
                <div className={`${estilos.panel} ${estilos[tema]}`}>
                    <h2 className={estilos.panelTitulo}>{tr('Todas las Cajas de Hoy', "Today's Registers")}</h2>
                    {todasLasCajas.length === 0 ? (
                        <div className={estilos.vacio}>
                            <ion-icon name="folder-open-outline"></ion-icon>
                            <span>{tr('No hay cajas abiertas hoy', 'No registers open today')}</span>
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
                                                <span className={estilos.cajaCardLabel}>{tr('Ventas', 'Sales')}</span>
                                                <span
                                                    className={estilos.cajaCardValor}>{formatearMoneda(caja.total_ventas)}</span>
                                            </div>
                                            <div className={estilos.cajaCardStat}>
                                                <span className={estilos.cajaCardLabel}>{tr('En Caja', 'In Register')}</span>
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
                            <h3>{tr('Abrir Caja', 'Open Register')}</h3>
                            <button onClick={() => setMostrarModalAbrir(false)} className={estilos.btnCerrarModal}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>
                        <form onSubmit={manejarAbrirCaja}>
                            <div className={estilos.modalBody}>
                                <div className={estilos.grupoInput}>
                                    <label>{tr('Número de Caja Disponible *', 'Available Register Number *')}</label>
                                    <select
                                        value={formAbrir.numero_caja}
                                        onChange={(e) => setFormAbrir({...formAbrir, numero_caja: e.target.value})}
                                        required
                                        disabled={procesando}
                                    >
                                        <option value="">{tr('Seleccionar caja', 'Select register')}</option>
                                        {cajasDisponibles.map((caja) => (
                                            <option key={caja.numero} value={caja.numero}>
                                                {tr('Caja', 'Register')} {caja.numero}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className={estilos.grupoInput}>
                                    <label>{tr('Monto Inicial *', 'Initial Amount *')}</label>
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
                                    {tr('Cancelar', 'Cancel')}
                                </button>
                                <button type="submit" className={estilos.btnGuardar} disabled={procesando}>
                                    <ion-icon name="checkmark-outline"></ion-icon>
                                    <span>{procesando ? tr('Abriendo...', 'Opening...') : tr('Abrir Caja', 'Open Register')}</span>
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
                            <h3>{tr('Registrar Gasto', 'Record Expense')}</h3>
                            <button onClick={() => setMostrarModalGasto(false)} className={estilos.btnCerrarModal}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>
                        <form onSubmit={manejarRegistrarGasto}>
                            <div className={estilos.modalBody}>
                                <div className={estilos.grupoInput}>
                                    <label>{tr('Concepto *', 'Concept *')}</label>
                                    <input
                                        type="text"
                                        value={formGasto.concepto}
                                        onChange={(e) => setFormGasto({...formGasto, concepto: e.target.value})}
                                        placeholder={tr('Ej: Compra de insumos', 'E.g.: Supply purchase')}
                                        required
                                        disabled={procesando}
                                    />
                                </div>
                                <div className={estilos.grupoInput}>
                                    <label>{tr('Monto *', 'Amount *')}</label>
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
                                    <label>{tr('Categoria', 'Category')}</label>
                                    <input
                                        type="text"
                                        value={formGasto.categoria}
                                        onChange={(e) => setFormGasto({...formGasto, categoria: e.target.value})}
                                        placeholder={tr('Ej: Operativo', 'E.g.: Operations')}
                                        disabled={procesando}
                                    />
                                </div>
                                <div className={estilos.grupoInput}>
                                    <label>{tr('Numero de Comprobante', 'Receipt Number')}</label>
                                    <input
                                        type="text"
                                        value={formGasto.comprobante_numero}
                                        onChange={(e) => setFormGasto({
                                            ...formGasto,
                                            comprobante_numero: e.target.value
                                        })}
                                        placeholder={tr('Ej: FAC-001', 'E.g.: INV-001')}
                                        disabled={procesando}
                                    />
                                </div>
                                <div className={estilos.grupoInput}>
                                    <label>{tr('Notas', 'Notes')}</label>
                                    <textarea
                                        value={formGasto.notas}
                                        onChange={(e) => setFormGasto({...formGasto, notas: e.target.value})}
                                        placeholder={tr('Detalles adicionales...', 'Additional details...')}
                                        rows="3"
                                        disabled={procesando}
                                    />
                                </div>
                            </div>
                            <div className={estilos.modalFooter}>
                                <button type="button" onClick={() => setMostrarModalGasto(false)}
                                        className={estilos.btnCancelar}>
                                    {tr('Cancelar', 'Cancel')}
                                </button>
                                <button type="submit" className={estilos.btnGuardar} disabled={procesando}>
                                    <ion-icon name="checkmark-outline"></ion-icon>
                                    <span>{procesando ? tr('Guardando...', 'Saving...') : tr('Registrar Gasto', 'Record Expense')}</span>
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
                            <h3>{tr('Cerrar Caja', 'Close Register')}</h3>
                            <button onClick={() => setMostrarModalCerrar(false)} className={estilos.btnCerrarModal}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>
                        <form onSubmit={manejarCerrarCaja}>
                            <div className={estilos.modalBody}>
                                <div className={estilos.alertaInfo}>
                                    <ion-icon name="information-circle-outline"></ion-icon>
                                    <span>{tr('Cuenta el dinero fisico en caja e ingresa el monto total', 'Count the physical cash in register and enter the total amount')}</span>
                                </div>
                                <div className={estilos.resumenCierre}>
                                    <div className={estilos.resumenItem}>
                                        <span>{tr('Monto Inicial:', 'Initial Amount:')}</span>
                                        <span>{formatearMoneda(cajaActiva.monto_inicial)}</span>
                                    </div>
                                    <div className={estilos.resumenItem}>
                                        <span>{tr('Ventas:', 'Sales:')}</span>
                                        <span>{formatearMoneda(cajaActiva.total_ventas)}</span>
                                    </div>
                                    <div className={estilos.resumenItem}>
                                        <span>{tr('Gastos:', 'Expenses:')}</span>
                                        <span>-{formatearMoneda(cajaActiva.total_gastos)}</span>
                                    </div>
                                    <div className={`${estilos.resumenItem} ${estilos.total}`}>
                                        <span>{tr('Esperado en Caja:', 'Expected in Register:')}</span>
                                        <span>{formatearMoneda(
                                            parseFloat(cajaActiva.monto_inicial || 0) +
                                            parseFloat(cajaActiva.total_ventas || 0) -
                                            parseFloat(cajaActiva.total_gastos || 0)
                                        )}</span>
                                    </div>
                                </div>
                                <div className={estilos.grupoInput}>
                                    <label>{tr('Monto Final en Caja *', 'Final Amount in Register *')}</label>
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
                                {formCerrar.monto_final && (() => {
                                    const diferencia = parseFloat(formCerrar.monto_final) - (
                                        parseFloat(cajaActiva.monto_inicial || 0) +
                                        parseFloat(cajaActiva.total_ventas || 0) -
                                        parseFloat(cajaActiva.total_gastos || 0)
                                    );
                                    let claseDif = '';
                                    if (diferencia > 0) claseDif = estilos.diferenciaPositiva;
                                    else if (diferencia < 0) claseDif = estilos.diferenciaNegativa;
                                    else claseDif = '';
                                    return (
                                        <div className={estilos.diferenciaInfo}>
                                            <span>Diferencia:</span>
                                            <span className={claseDif} style={{color: diferencia > 0 ? '#22c55e' : diferencia < 0 ? '#ef4444' : undefined, fontWeight: 700}}>
                                                {formatearMoneda(diferencia)}
                                            </span>
                                        </div>
                                    );
                                })()}
                                <div className={estilos.grupoInput}>
                                    <label>{tr('Notas', 'Notes')}</label>
                                    <textarea
                                        value={formCerrar.notas}
                                        onChange={(e) => setFormCerrar({...formCerrar, notas: e.target.value})}
                                        placeholder={tr('Observaciones del cierre...', 'Closing observations...')}
                                        rows="3"
                                        disabled={procesando}
                                    />
                                </div>
                            </div>
                            <div className={estilos.modalFooter}>
                                <button type="button" onClick={() => setMostrarModalCerrar(false)}
                                        className={estilos.btnCancelar}>
                                    {tr('Cancelar', 'Cancel')}
                                </button>
                                <button type="submit" className={estilos.btnGuardar} disabled={procesando}>
                                    <ion-icon name="lock-closed-outline"></ion-icon>
                                    <span>{procesando ? tr('Cerrando...', 'Closing...') : tr('Cerrar Caja', 'Close Register')}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            
            {(mostrarAlertaCajaVieja && !alertaCajaViejaOculta && cajaActiva) && (
                <div className={estilos.modalAlerta}>
                    <div className={estilos.alertaContenido}>
                        <div className={estilos.alertaBarra} />
                        <div className={estilos.alertaTexto}>
                            <div className={estilos.alertaIcono}>
                                <ion-icon name="warning-outline"></ion-icon>
                            </div>
                            <h2 className={estilos.alertaTitulo}>{tr('Caja de Día Anterior', 'Previous Day Register')}</h2>
                            <p className={estilos.alertaDescripcion}>
                                {tr('Tu Caja', 'Your Register')} {cajaActiva.numero_caja} {tr('fue abierta el', 'was opened on')}
                                <strong className={estilos.alertaFecha}>
                                    {formatearFecha(cajaActiva.fecha_caja)}
                                </strong>
                            </p>
                            <div className={estilos.alertaCuadro}>
                                <p>
                                    {tr('Para registrar gastos y ventas correctamente, debes cerrar esta caja y abrir una nueva para el día de hoy.', 'To correctly record expenses and sales, you must close this register and open a new one for today.')}
                                </p>
                            </div>
                            <button
                                onClick={() => setAlertaCajaViejaOculta(true)}
                                className={estilos.btnAlertaCerrar}
                            >
                                {tr('Entendido', 'Got it')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}