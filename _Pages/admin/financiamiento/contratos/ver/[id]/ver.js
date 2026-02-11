"use client"
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
    obtenerContratoPorId
} from '../../../../contratos/servidor'
// Los pagos se gestionan desde el módulo pagos (independiente)
// import { registrarPagoCuota } from '../../../pagos/servidor'
import { calcularDiasAtraso } from '@/_Pages/admin/core/finance/calculos'
import { formatearEstadoCuota } from '@/_Pages/admin/core/finance/estados'

// Función para formatear moneda
function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: 'DOP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(valor || 0)
}
import estilos from './ver.module.css'

export default function VerContratoFinanciamiento() {
    const router = useRouter()
    const params = useParams()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [contrato, setContrato] = useState(null)
    const [cuotas, setCuotas] = useState([])
    const [pagos, setPagos] = useState([])
    const [activos, setActivos] = useState([])
    const [tabActivo, setTabActivo] = useState('cuotas')
    const [mostrarModalPago, setMostrarModalPago] = useState(false)
    const [cuotaSeleccionada, setCuotaSeleccionada] = useState(null)
    const [procesando, setProcesando] = useState(false)

    const [formPago, setFormPago] = useState({
        monto_pago: '',
        metodo_pago: 'efectivo',
        fecha_pago: new Date().toISOString().split('T')[0],
        numero_referencia: '',
        ultimos_digitos_tarjeta: '',
        nombre_banco: '',
        notas: ''
    })

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
        if (params.id) {
            cargarContrato()
        }
    }, [params.id])

    const cargarContrato = async () => {
        setCargando(true)
        try {
            const resultado = await obtenerContratoPorId(params.id)
            if (resultado.success) {
                setContrato(resultado.contrato)
                setCuotas(resultado.cuotas || [])
                setPagos(resultado.pagos || [])
                setActivos(resultado.activos || [])
            } else {
                alert(resultado.mensaje || 'No se pudo cargar el contrato')
                router.push('/admin/contratos')
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error al cargar contrato')
            router.push('/admin/contratos')
        } finally {
            setCargando(false)
        }
    }

    const abrirModalPago = (cuota) => {
        setCuotaSeleccionada(cuota)
        const diasAtraso = calcularDiasAtraso(cuota.fecha_vencimiento)
        const montoTotal = parseFloat(cuota.monto_cuota) + parseFloat(cuota.monto_mora || 0)
        const montoPendiente = montoTotal - parseFloat(cuota.monto_pagado || 0)

        setFormPago({
            monto_pago: montoPendiente.toFixed(2),
            metodo_pago: 'efectivo',
            fecha_pago: new Date().toISOString().split('T')[0],
            numero_referencia: '',
            ultimos_digitos_tarjeta: '',
            nombre_banco: '',
            notas: ''
        })
        setMostrarModalPago(true)
    }

    const cerrarModalPago = () => {
        setMostrarModalPago(false)
        setCuotaSeleccionada(null)
    }

    const manejarCambioPago = (e) => {
        const { name, value } = e.target
        setFormPago(prev => ({ ...prev, [name]: value }))
    }

    const procesarPago = async () => {
        // TODO: Implementar cuando el módulo pagos esté listo
        // Los pagos se gestionan desde el módulo pagos (independiente)
        alert('La funcionalidad de pagos se implementará en el módulo pagos')
        cerrarModalPago()
        
        // Código temporal comentado:
        /*
        if (!cuotaSeleccionada) return

        if (!formPago.monto_pago || parseFloat(formPago.monto_pago) <= 0) {
            alert('El monto del pago debe ser mayor a cero')
            return
        }

        setProcesando(true)
        try {
            const { registrarPagoCuota } = await import('../../../pagos/servidor')
            const resultado = await registrarPagoCuota({
                cuota_id: cuotaSeleccionada.id,
                monto_pago: parseFloat(formPago.monto_pago),
                metodo_pago: formPago.metodo_pago,
                fecha_pago: formPago.fecha_pago,
                numero_referencia: formPago.numero_referencia || null,
                ultimos_digitos_tarjeta: formPago.ultimos_digitos_tarjeta || null,
                nombre_banco: formPago.nombre_banco || null,
                notas: formPago.notas || null
            })

            if (resultado.success) {
                alert(resultado.mensaje || 'Pago registrado exitosamente')
                cerrarModalPago()
                cargarContrato()
            } else {
                alert(resultado.mensaje || 'Error al registrar pago')
            }
        } catch (error) {
            console.error('Error al procesar pago:', error)
            alert('Error al procesar pago')
        } finally {
            setProcesando(false)
        }
        */
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

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando contrato...</span>
                </div>
            </div>
        )
    }

    if (!contrato) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.error}>
                    <ion-icon name="alert-circle-outline"></ion-icon>
                    <span>Contrato no encontrado</span>
                </div>
            </div>
        )
    }

    const diasAtrasoContrato = cuotas.length > 0 
        ? Math.max(...cuotas.map(c => calcularDiasAtraso(c.fecha_vencimiento)))
        : 0

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* Header */}
            <div className={estilos.header}>
                <div className={estilos.headerIzq}>
                    <Link href="/admin/contratos" className={estilos.btnVolver}>
                        <ion-icon name="arrow-back-outline"></ion-icon>
                        Volver
                    </Link>
                    <div>
                        <h1 className={estilos.titulo}>{contrato.numero_contrato}</h1>
                        <p className={estilos.subtitulo}>
                            Creado el {formatearFecha(contrato.fecha_contrato)}
                        </p>
                    </div>
                </div>
                <div className={estilos.headerAcciones}>
                    {contrato && contrato.estado === 'activo' && contrato.saldo_pendiente > 0 && (
                        <Link
                            href={`/admin/contratos/refinanciar/${params.id}`}
                            className={estilos.btnRefinanciar}
                        >
                            <ion-icon name="refresh-outline"></ion-icon>
                            Refinanciar
                        </Link>
                    )}
                    <button className={estilos.btnSecundario}>
                        <ion-icon name="print-outline"></ion-icon>
                        Imprimir
                    </button>
                    <button className={estilos.btnSecundario}>
                        <ion-icon name="download-outline"></ion-icon>
                        Descargar
                    </button>
                </div>
            </div>

            {/* Banner de estado */}
            {diasAtrasoContrato > 0 && (
                <div className={`${estilos.bannerEstado} ${estilos.vencido}`}>
                    <ion-icon name="warning-outline"></ion-icon>
                    <div>
                        <strong>Cuota Vencida - {diasAtrasoContrato} días de atraso</strong>
                        <p>Última acción: Llamada telefónica (hace 2 días)</p>
                    </div>
                    <button className={estilos.btnBanner} onClick={() => {
                        const cuotaVencida = cuotas.find(c => calcularDiasAtraso(c.fecha_vencimiento) > 0 && c.estado !== 'pagada')
                        if (cuotaVencida) abrirModalPago(cuotaVencida)
                    }}>
                        Registrar Pago
                    </button>
                </div>
            )}

            {/* Información financiera */}
            <div className={estilos.infoFinanciera}>
                <div className={estilos.metricasGrid}>
                    <div className={estilos.metrica}>
                        <span className={estilos.metricaLabel}>Precio Total</span>
                        <span className={estilos.metricaValor}>
                            {formatearMoneda(contrato.precio_producto)}
                        </span>
                    </div>
                    <div className={estilos.metrica}>
                        <span className={estilos.metricaLabel}>Inicial Pagada</span>
                        <span className={`${estilos.metricaValor} ${estilos.success}`}>
                            {formatearMoneda(contrato.pago_inicial)}
                        </span>
                    </div>
                    <div className={estilos.metrica}>
                        <span className={estilos.metricaLabel}>Monto Financiado</span>
                        <span className={estilos.metricaValor}>
                            {formatearMoneda(contrato.monto_financiado)}
                        </span>
                    </div>
                    <div className={estilos.metrica}>
                        <span className={estilos.metricaLabel}>Saldo Pendiente</span>
                        <span className={`${estilos.metricaValor} ${estilos.danger}`}>
                            {formatearMoneda(contrato.saldo_pendiente)}
                        </span>
                    </div>
                </div>

                <div className={estilos.detallesContrato}>
                    <div className={estilos.detalleItem}>
                        <span className={estilos.detalleLabel}>Plan</span>
                        <span className={estilos.detalleValor}>{contrato.plan_nombre}</span>
                    </div>
                    <div className={estilos.detalleItem}>
                        <span className={estilos.detalleLabel}>Cuota Mensual</span>
                        <span className={estilos.detalleValor}>
                            {formatearMoneda(contrato.monto_cuota)}
                        </span>
                    </div>
                    <div className={estilos.detalleItem}>
                        <span className={estilos.detalleLabel}>NCF</span>
                        <span className={estilos.detalleValor}>{contrato.ncf}</span>
                    </div>
                    <div className={estilos.detalleItem}>
                        <span className={estilos.detalleLabel}>Estado</span>
                        <span className={`${estilos.badge} ${estilos[obtenerColorEstado(contrato.estado)]}`}>
                            {contrato.estado}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className={estilos.tabsContainer}>
                <div className={estilos.tabs}>
                    <button
                        className={`${estilos.tab} ${tabActivo === 'cuotas' ? estilos.tabActivo : ''}`}
                        onClick={() => setTabActivo('cuotas')}
                    >
                        Cronograma de Cuotas
                        {cuotas.length > 0 && (
                            <span className={estilos.tabBadge}>{cuotas.length}</span>
                        )}
                    </button>
                    <button
                        className={`${estilos.tab} ${tabActivo === 'pagos' ? estilos.tabActivo : ''}`}
                        onClick={() => setTabActivo('pagos')}
                    >
                        Historial de Pagos
                        {pagos.length > 0 && (
                            <span className={estilos.tabBadge}>{pagos.length}</span>
                        )}
                    </button>
                    <button
                        className={`${estilos.tab} ${tabActivo === 'activos' ? estilos.tabActivo : ''}`}
                        onClick={() => setTabActivo('activos')}
                    >
                        Activos
                        {activos.length > 0 && (
                            <span className={estilos.tabBadge}>{activos.length}</span>
                        )}
                    </button>
                    <button
                        className={`${estilos.tab} ${tabActivo === 'info' ? estilos.tabActivo : ''}`}
                        onClick={() => setTabActivo('info')}
                    >
                        Información
                    </button>
                </div>

                <div className={estilos.tabContent}>
                    {tabActivo === 'cuotas' && (
                        <div className={estilos.cuotasLista}>
                            {cuotas.length === 0 ? (
                                <div className={estilos.sinDatos}>No hay cuotas registradas</div>
                            ) : (
                                cuotas.map((cuota) => {
                                    const diasAtraso = calcularDiasAtraso(cuota.fecha_vencimiento)
                                    const montoTotal = parseFloat(cuota.monto_cuota) + parseFloat(cuota.monto_mora || 0)
                                    const montoPendiente = montoTotal - parseFloat(cuota.monto_pagado || 0)
                                    const estadoCuota = formatearEstadoCuota(cuota.estado)

                                    return (
                                        <div
                                            key={cuota.id}
                                            className={`${estilos.cuotaCard} ${
                                                cuota.estado === 'vencida' ? estilos.vencida :
                                                cuota.estado === 'pagada' ? estilos.pagada :
                                                estilos.pendiente
                                            }`}
                                        >
                                            <div className={estilos.cuotaHeader}>
                                                <div className={estilos.cuotaNumero}>
                                                    <span className={estilos.numeroBadge}>
                                                        {cuota.numero_cuota}
                                                    </span>
                                                    <div>
                                                        <strong>Cuota #{cuota.numero_cuota}</strong>
                                                        <p>Vence: {formatearFecha(cuota.fecha_vencimiento)}</p>
                                                    </div>
                                                </div>
                                                <div className={estilos.cuotaEstado}>
                                                    <span className={`${estilos.badge} ${estilos[estadoCuota.color]}`}>
                                                        {estadoCuota.texto}
                                                    </span>
                                                    {diasAtraso > 0 && (
                                                        <span className={estilos.diasAtraso}>
                                                            {diasAtraso} días de atraso
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className={estilos.cuotaDetalles}>
                                                <div className={estilos.detalleFinanciero}>
                                                    <div>
                                                        <span className={estilos.detalleLabel}>Capital</span>
                                                        <span className={estilos.detalleValor}>
                                                            {formatearMoneda(cuota.monto_capital)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className={estilos.detalleLabel}>Interés</span>
                                                        <span className={estilos.detalleValor}>
                                                            {formatearMoneda(cuota.monto_interes)}
                                                        </span>
                                                    </div>
                                                    {parseFloat(cuota.monto_mora || 0) > 0 && (
                                                        <div>
                                                            <span className={estilos.detalleLabel}>Mora</span>
                                                            <span className={`${estilos.detalleValor} ${estilos.danger}`}>
                                                                {formatearMoneda(cuota.monto_mora)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <span className={estilos.detalleLabel}>Total</span>
                                                        <span className={`${estilos.detalleValor} ${estilos.total}`}>
                                                            {formatearMoneda(montoTotal)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {cuota.estado !== 'pagada' && montoPendiente > 0 && (
                                                    <div className={estilos.cuotaAcciones}>
                                                        <div className={estilos.montoPendiente}>
                                                            <span>Pendiente: {formatearMoneda(montoPendiente)}</span>
                                                        </div>
                                                        <button
                                                            className={estilos.btnPagar}
                                                            onClick={() => abrirModalPago(cuota)}
                                                        >
                                                            <ion-icon name="cash-outline"></ion-icon>
                                                            Registrar Pago
                                                        </button>
                                                    </div>
                                                )}

                                                {cuota.fecha_pago && (
                                                    <div className={estilos.fechaPago}>
                                                        Pagado el {formatearFecha(cuota.fecha_pago)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    )}

                    {tabActivo === 'pagos' && (
                        <div className={estilos.pagosLista}>
                            {pagos.length === 0 ? (
                                <div className={estilos.sinDatos}>No hay pagos registrados</div>
                            ) : (
                                pagos.map((pago) => (
                                    <div key={pago.id} className={estilos.pagoCard}>
                                        <div className={estilos.pagoHeader}>
                                            <div className={estilos.pagoIcono}>
                                                <ion-icon name="checkmark-circle"></ion-icon>
                                            </div>
                                            <div className={estilos.pagoInfo}>
                                                <strong>Recibo: {pago.numero_recibo}</strong>
                                                <p>{formatearFecha(pago.fecha_pago)} • {pago.registrado_por_nombre}</p>
                                            </div>
                                            <div className={estilos.pagoMonto}>
                                                {formatearMoneda(pago.monto_pago)}
                                            </div>
                                        </div>
                                        <div className={estilos.pagoDetalle}>
                                            <div className={estilos.pagoDesglose}>
                                                {pago.aplicado_capital > 0 && (
                                                    <span>Capital: {formatearMoneda(pago.aplicado_capital)}</span>
                                                )}
                                                {pago.aplicado_interes > 0 && (
                                                    <span>Interés: {formatearMoneda(pago.aplicado_interes)}</span>
                                                )}
                                                {pago.aplicado_mora > 0 && (
                                                    <span>Mora: {formatearMoneda(pago.aplicado_mora)}</span>
                                                )}
                                                {pago.aplicado_futuro > 0 && (
                                                    <span>Futuro: {formatearMoneda(pago.aplicado_futuro)}</span>
                                                )}
                                            </div>
                                            <div className={estilos.pagoMetodo}>
                                                Método: {pago.metodo_pago}
                                                {pago.numero_referencia && ` • Ref: ${pago.numero_referencia}`}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {tabActivo === 'activos' && (
                        <div className={estilos.activosLista}>
                            {activos.length === 0 ? (
                                <div className={estilos.sinDatos}>No hay activos asociados</div>
                            ) : (
                                activos.map((activo) => (
                                    <div key={activo.id} className={estilos.activoCard}>
                                        <div className={estilos.activoHeader}>
                                            <div>
                                                <h3>{activo.producto_nombre}</h3>
                                                <p>Código: {activo.codigo_activo}</p>
                                            </div>
                                            <span className={`${estilos.badge} ${estilos[activo.estado === 'financiado' ? 'info' : 'secondary']}`}>
                                                {activo.estado}
                                            </span>
                                        </div>
                                        <div className={estilos.activoDetalles}>
                                            {activo.numero_serie && (
                                                <div>
                                                    <span>Número de Serie:</span>
                                                    <strong>{activo.numero_serie}</strong>
                                                </div>
                                            )}
                                            {activo.vin && (
                                                <div>
                                                    <span>VIN:</span>
                                                    <strong>{activo.vin}</strong>
                                                </div>
                                            )}
                                            {activo.color && (
                                                <div>
                                                    <span>Color:</span>
                                                    <strong>{activo.color}</strong>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {tabActivo === 'info' && (
                        <div className={estilos.infoCliente}>
                            <div className={estilos.infoSection}>
                                <h3>Información del Cliente</h3>
                                <div className={estilos.infoGrid}>
                                    <div>
                                        <span className={estilos.infoLabel}>Nombre:</span>
                                        <span className={estilos.infoValue}>
                                            {contrato.cliente_nombre} {contrato.cliente_apellidos || ''}
                                        </span>
                                    </div>
                                    <div>
                                        <span className={estilos.infoLabel}>Documento:</span>
                                        <span className={estilos.infoValue}>{contrato.cliente_documento}</span>
                                    </div>
                                    <div>
                                        <span className={estilos.infoLabel}>Teléfono:</span>
                                        <span className={estilos.infoValue}>{contrato.cliente_telefono || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className={estilos.infoLabel}>Email:</span>
                                        <span className={estilos.infoValue}>{contrato.cliente_email || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className={estilos.infoLabel}>Dirección:</span>
                                        <span className={estilos.infoValue}>{contrato.cliente_direccion || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={estilos.infoSection}>
                                <h3>Detalles del Contrato</h3>
                                <div className={estilos.infoGrid}>
                                    <div>
                                        <span className={estilos.infoLabel}>Vendedor:</span>
                                        <span className={estilos.infoValue}>{contrato.vendedor_nombre}</span>
                                    </div>
                                    <div>
                                        <span className={estilos.infoLabel}>Fecha Primer Pago:</span>
                                        <span className={estilos.infoValue}>
                                            {formatearFecha(contrato.fecha_primer_pago)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className={estilos.infoLabel}>Fecha Último Pago:</span>
                                        <span className={estilos.infoValue}>
                                            {formatearFecha(contrato.fecha_ultimo_pago)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className={estilos.infoLabel}>Clasificación Riesgo:</span>
                                        <span className={estilos.infoValue}>{contrato.clasificacion_riesgo}</span>
                                    </div>
                                </div>
                            </div>

                            {contrato.notas && (
                                <div className={estilos.infoSection}>
                                    <h3>Notas</h3>
                                    <p className={estilos.notas}>{contrato.notas}</p>
                                </div>
                            )}

                            {contrato.nombre_fiador && (
                                <div className={estilos.infoSection}>
                                    <h3>Información del Fiador</h3>
                                    <div className={estilos.infoGrid}>
                                        <div>
                                            <span className={estilos.infoLabel}>Nombre:</span>
                                            <span className={estilos.infoValue}>{contrato.nombre_fiador}</span>
                                        </div>
                                        <div>
                                            <span className={estilos.infoLabel}>Documento:</span>
                                            <span className={estilos.infoValue}>{contrato.documento_fiador}</span>
                                        </div>
                                        <div>
                                            <span className={estilos.infoLabel}>Teléfono:</span>
                                            <span className={estilos.infoValue}>{contrato.telefono_fiador}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de pago */}
            {mostrarModalPago && cuotaSeleccionada && (
                <div className={estilos.modalOverlay} onClick={cerrarModalPago}>
                    <div className={estilos.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <h2>Registrar Pago - Cuota #{cuotaSeleccionada.numero_cuota}</h2>
                            <button className={estilos.btnCerrar} onClick={cerrarModalPago}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>

                        <div className={estilos.modalBody}>
                            <div className={estilos.resumenPago}>
                                <div className={estilos.resumenItem}>
                                    <span>Monto Cuota:</span>
                                    <strong>{formatearMoneda(cuotaSeleccionada.monto_cuota)}</strong>
                                </div>
                                {parseFloat(cuotaSeleccionada.monto_mora || 0) > 0 && (
                                    <div className={estilos.resumenItem}>
                                        <span>Mora:</span>
                                        <strong className={estilos.danger}>
                                            {formatearMoneda(cuotaSeleccionada.monto_mora)}
                                        </strong>
                                    </div>
                                )}
                                <div className={estilos.resumenItem}>
                                    <span>Ya Pagado:</span>
                                    <strong>{formatearMoneda(cuotaSeleccionada.monto_pagado || 0)}</strong>
                                </div>
                                <div className={`${estilos.resumenItem} ${estilos.resumenTotal}`}>
                                    <span>Total a Pagar:</span>
                                    <strong>
                                        {formatearMoneda(
                                            parseFloat(cuotaSeleccionada.monto_cuota) +
                                            parseFloat(cuotaSeleccionada.monto_mora || 0) -
                                            parseFloat(cuotaSeleccionada.monto_pagado || 0)
                                        )}
                                    </strong>
                                </div>
                            </div>

                            <div className={estilos.formPago}>
                                <div className={estilos.formGroup}>
                                    <label>Monto a Pagar *</label>
                                    <input
                                        type="number"
                                        name="monto_pago"
                                        value={formPago.monto_pago}
                                        onChange={manejarCambioPago}
                                        step="0.01"
                                        min="0"
                                        required
                                    />
                                </div>

                                <div className={estilos.formGroup}>
                                    <label>Método de Pago *</label>
                                    <select
                                        name="metodo_pago"
                                        value={formPago.metodo_pago}
                                        onChange={manejarCambioPago}
                                        required
                                    >
                                        <option value="efectivo">Efectivo</option>
                                        <option value="tarjeta_debito">Tarjeta Débito</option>
                                        <option value="tarjeta_credito">Tarjeta Crédito</option>
                                        <option value="transferencia">Transferencia</option>
                                        <option value="cheque">Cheque</option>
                                        <option value="mixto">Mixto</option>
                                    </select>
                                </div>

                                <div className={estilos.formGroup}>
                                    <label>Fecha de Pago *</label>
                                    <input
                                        type="date"
                                        name="fecha_pago"
                                        value={formPago.fecha_pago}
                                        onChange={manejarCambioPago}
                                        required
                                    />
                                </div>

                                {(formPago.metodo_pago === 'transferencia' || formPago.metodo_pago === 'cheque') && (
                                    <div className={estilos.formGroup}>
                                        <label>Número de Referencia</label>
                                        <input
                                            type="text"
                                            name="numero_referencia"
                                            value={formPago.numero_referencia}
                                            onChange={manejarCambioPago}
                                            placeholder="Número de cheque o referencia de transferencia"
                                        />
                                    </div>
                                )}

                                {(formPago.metodo_pago === 'tarjeta_debito' || formPago.metodo_pago === 'tarjeta_credito') && (
                                    <>
                                        <div className={estilos.formGroup}>
                                            <label>Últimos 4 dígitos de tarjeta</label>
                                            <input
                                                type="text"
                                                name="ultimos_digitos_tarjeta"
                                                value={formPago.ultimos_digitos_tarjeta}
                                                onChange={manejarCambioPago}
                                                maxLength="4"
                                                placeholder="1234"
                                            />
                                        </div>
                                        <div className={estilos.formGroup}>
                                            <label>Banco</label>
                                            <input
                                                type="text"
                                                name="nombre_banco"
                                                value={formPago.nombre_banco}
                                                onChange={manejarCambioPago}
                                                placeholder="Nombre del banco"
                                            />
                                        </div>
                                    </>
                                )}

                                <div className={estilos.formGroup}>
                                    <label>Notas</label>
                                    <textarea
                                        name="notas"
                                        value={formPago.notas}
                                        onChange={manejarCambioPago}
                                        rows="3"
                                        placeholder="Notas adicionales sobre el pago"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={estilos.modalFooter}>
                            <button
                                className={estilos.btnCancelar}
                                onClick={cerrarModalPago}
                                disabled={procesando}
                            >
                                Cancelar
                            </button>
                            <button
                                className={estilos.btnGuardar}
                                onClick={procesarPago}
                                disabled={procesando}
                            >
                                {procesando ? 'Procesando...' : 'Registrar Pago'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}


