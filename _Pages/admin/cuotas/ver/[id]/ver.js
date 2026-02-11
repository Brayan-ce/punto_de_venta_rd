"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { obtenerCuotaPorId, calcularMoraCuota } from '../../servidor'
import { formatearEstadoCuota, formatearMetodoPago } from '../../../core/finance/estados'
import estilos from './ver.module.css'

export default function VerCuota({ cuotaId }) {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [cuota, setCuota] = useState(null)
    const [error, setError] = useState(null)
    const [calculandoMora, setCalculandoMora] = useState(false)

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
        if (cuotaId) {
            cargarCuota()
        }
    }, [cuotaId])

    const cargarCuota = async () => {
        setCargando(true)
        setError(null)
        try {
            const resultado = await obtenerCuotaPorId(cuotaId)
            if (resultado.success) {
                setCuota(resultado.cuota)
            } else {
                setError(resultado.mensaje || 'Error al cargar la cuota')
            }
        } catch (error) {
            console.error('Error al cargar cuota:', error)
            setError('Error al cargar la cuota')
        } finally {
            setCargando(false)
        }
    }

    const recalcularMora = async () => {
        setCalculandoMora(true)
        try {
            const resultado = await calcularMoraCuota(cuotaId)
            if (resultado.success) {
                await cargarCuota()
            } else {
                alert(resultado.mensaje || 'Error al calcular mora')
            }
        } catch (error) {
            console.error('Error al calcular mora:', error)
        } finally {
            setCalculandoMora(false)
        }
    }

    const formatearFecha = (fecha) => {
        if (!fecha) return '-'
        return new Date(fecha).toLocaleDateString('es-DO', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        })
    }

    const formatearFechaCorta = (fecha) => {
        if (!fecha) return '-'
        return new Date(fecha).toLocaleDateString('es-DO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2
        }).format(monto || 0)
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <div className={estilos.cargandoSpinner}></div>
                    <span>Cargando información de la cuota...</span>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.error}>
                    <ion-icon name="alert-circle-outline"></ion-icon>
                    <h2>Error</h2>
                    <p>{error}</p>
                    <button onClick={() => router.back()} className={estilos.btnSecundario}>
                        <ion-icon name="arrow-back-outline"></ion-icon>
                        Volver
                    </button>
                </div>
            </div>
        )
    }

    if (!cuota) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.error}>
                    <ion-icon name="document-outline"></ion-icon>
                    <h2>Cuota no encontrada</h2>
                    <p>La cuota que buscas no existe o fue eliminada.</p>
                    <Link href="/admin/cuotas" className={estilos.btnSecundario}>
                        <ion-icon name="arrow-back-outline"></ion-icon>
                        Volver a Cuotas
                    </Link>
                </div>
            </div>
        )
    }

    const estadoInfo = formatearEstadoCuota(cuota.estado)
    const diasAtraso = cuota.dias_atraso_calculado || 0
    const esVencida = diasAtraso > 0 && cuota.estado !== 'pagada'
    const montoPendiente = cuota.total_a_pagar_calculado || 
        (parseFloat(cuota.monto_cuota) + parseFloat(cuota.monto_mora || 0) - parseFloat(cuota.monto_pagado || 0))
    const porcentajePago = ((parseFloat(cuota.monto_pagado) / parseFloat(cuota.monto_cuota)) * 100).toFixed(0)

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* Header */}
            <header className={estilos.header}>
                <div className={estilos.headerNav}>
                    <button onClick={() => router.back()} className={estilos.btnVolver}>
                        <ion-icon name="arrow-back-outline"></ion-icon>
                    </button>
                    <div className={estilos.headerBreadcrumb}>
                        <Link href="/admin/cuotas">Cuotas</Link>
                        <ion-icon name="chevron-forward-outline"></ion-icon>
                        <span>Detalle Cuota #{cuota.numero_cuota}</span>
                    </div>
                </div>
                <div className={estilos.headerAcciones}>
                    <Link 
                        href={`/admin/contratos/ver/${cuota.contrato_id}`}
                        className={estilos.btnSecundario}
                    >
                        <ion-icon name="document-text-outline"></ion-icon>
                        Ver Contrato
                    </Link>
                    {cuota.estado !== 'pagada' && (
                        <Link 
                            href={`/admin/contratos/ver/${cuota.contrato_id}#pagos`}
                            className={estilos.btnPrimario}
                        >
                            <ion-icon name="cash-outline"></ion-icon>
                            Registrar Pago
                        </Link>
                    )}
                </div>
            </header>

            {/* Alerta de estado */}
            {esVencida && (
                <div className={estilos.alertaVencida}>
                    <div className={estilos.alertaIcono}>
                        <ion-icon name="warning-outline"></ion-icon>
                    </div>
                    <div className={estilos.alertaContenido}>
                        <h3>Cuota Vencida</h3>
                        <p>Esta cuota tiene {diasAtraso} días de atraso. Se ha acumulado mora por {formatearMoneda(cuota.monto_mora_calculado || cuota.monto_mora)}</p>
                    </div>
                    <button 
                        onClick={recalcularMora} 
                        className={estilos.btnRecalcular}
                        disabled={calculandoMora}
                    >
                        {calculandoMora ? (
                            <>
                                <div className={estilos.miniSpinner}></div>
                                Calculando...
                            </>
                        ) : (
                            <>
                                <ion-icon name="refresh-outline"></ion-icon>
                                Recalcular Mora
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Grid principal */}
            <div className={estilos.gridPrincipal}>
                {/* Información de la cuota */}
                <div className={estilos.cardPrincipal}>
                    <div className={estilos.cardHeader}>
                        <div className={estilos.cuotaNumero}>
                            <span className={estilos.cuotaLabel}>Cuota</span>
                            <span className={estilos.cuotaValor}>#{cuota.numero_cuota}</span>
                        </div>
                        <span className={`${estilos.badge} ${estilos[estadoInfo.color]}`}>
                            {estadoInfo.texto}
                        </span>
                    </div>

                    <div className={estilos.montosPrincipales}>
                        <div className={estilos.montoGrande}>
                            <span className={estilos.montoGrandeLabel}>Monto de la Cuota</span>
                            <span className={estilos.montoGrandeValor}>{formatearMoneda(cuota.monto_cuota)}</span>
                        </div>

                        <div className={estilos.desglose}>
                            <div className={estilos.desgloseItem}>
                                <span className={estilos.desgloseLabel}>Capital</span>
                                <span className={estilos.desgloseValor}>{formatearMoneda(cuota.monto_capital)}</span>
                            </div>
                            <div className={estilos.desgloseItem}>
                                <span className={estilos.desgloseLabel}>Interés</span>
                                <span className={estilos.desgloseValor}>{formatearMoneda(cuota.monto_interes)}</span>
                            </div>
                            {parseFloat(cuota.monto_mora) > 0 && (
                                <div className={`${estilos.desgloseItem} ${estilos.mora}`}>
                                    <span className={estilos.desgloseLabel}>Mora</span>
                                    <span className={estilos.desgloseValor}>{formatearMoneda(cuota.monto_mora)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={estilos.separador}></div>

                    <div className={estilos.estadoPago}>
                        <div className={estilos.estadoPagoInfo}>
                            <div className={estilos.estadoPagoItem}>
                                <span className={estilos.estadoPagoLabel}>Pagado</span>
                                <span className={`${estilos.estadoPagoValor} ${estilos.verde}`}>
                                    {formatearMoneda(cuota.monto_pagado)}
                                </span>
                            </div>
                            <div className={estilos.estadoPagoItem}>
                                <span className={estilos.estadoPagoLabel}>Pendiente</span>
                                <span className={`${estilos.estadoPagoValor} ${estilos.naranja}`}>
                                    {formatearMoneda(montoPendiente)}
                                </span>
                            </div>
                        </div>
                        <div className={estilos.barraProgreso}>
                            <div className={estilos.progresoInfo}>
                                <span>Progreso de pago</span>
                                <span>{porcentajePago}%</span>
                            </div>
                            <div className={estilos.barraProgresoTrack}>
                                <div 
                                    className={estilos.barraProgresoFill}
                                    style={{ width: `${Math.min(porcentajePago, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Panel lateral */}
                <div className={estilos.panelLateral}>
                    {/* Fechas */}
                    <div className={estilos.cardSecundario}>
                        <h3 className={estilos.cardSecundarioTitulo}>
                            <ion-icon name="calendar-outline"></ion-icon>
                            Fechas
                        </h3>
                        <div className={estilos.infoLista}>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>Vencimiento</span>
                                <span className={estilos.infoValor}>{formatearFecha(cuota.fecha_vencimiento)}</span>
                            </div>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>Fin período de gracia</span>
                                <span className={estilos.infoValor}>{formatearFechaCorta(cuota.fecha_fin_gracia)}</span>
                            </div>
                            {cuota.fecha_pago && (
                                <div className={estilos.infoItem}>
                                    <span className={estilos.infoLabel}>Fecha de pago</span>
                                    <span className={`${estilos.infoValor} ${estilos.verde}`}>
                                        {formatearFechaCorta(cuota.fecha_pago)}
                                    </span>
                                </div>
                            )}
                            {diasAtraso > 0 && cuota.estado !== 'pagada' && (
                                <div className={estilos.infoItem}>
                                    <span className={estilos.infoLabel}>Días de atraso</span>
                                    <span className={`${estilos.infoValor} ${estilos.rojo}`}>
                                        {diasAtraso} días
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Contrato */}
                    <div className={estilos.cardSecundario}>
                        <h3 className={estilos.cardSecundarioTitulo}>
                            <ion-icon name="document-text-outline"></ion-icon>
                            Contrato
                        </h3>
                        <div className={estilos.infoLista}>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>Número</span>
                                <Link 
                                    href={`/admin/contratos/ver/${cuota.contrato_id}`}
                                    className={estilos.infoLink}
                                >
                                    {cuota.numero_contrato}
                                </Link>
                            </div>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>Fecha contrato</span>
                                <span className={estilos.infoValor}>{formatearFechaCorta(cuota.fecha_contrato)}</span>
                            </div>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>Plan</span>
                                <span className={estilos.infoValor}>{cuota.plan_nombre}</span>
                            </div>
                        </div>
                    </div>

                    {/* Cliente */}
                    <div className={estilos.cardSecundario}>
                        <h3 className={estilos.cardSecundarioTitulo}>
                            <ion-icon name="person-outline"></ion-icon>
                            Cliente
                        </h3>
                        <div className={estilos.clienteCard}>
                            <div className={estilos.avatarCliente}>
                                {cuota.cliente_nombre?.charAt(0) || 'C'}
                            </div>
                            <div className={estilos.clienteInfo}>
                                <span className={estilos.clienteNombre}>
                                    {cuota.cliente_nombre} {cuota.cliente_apellidos}
                                </span>
                                <span className={estilos.clienteDoc}>{cuota.cliente_documento}</span>
                                {cuota.cliente_telefono && (
                                    <a href={`tel:${cuota.cliente_telefono}`} className={estilos.clienteTelefono}>
                                        <ion-icon name="call-outline"></ion-icon>
                                        {cuota.cliente_telefono}
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Historial de pagos */}
            {cuota.pagos && cuota.pagos.length > 0 && (
                <section className={estilos.seccionPagos}>
                    <h2 className={estilos.seccionTitulo}>
                        <ion-icon name="receipt-outline"></ion-icon>
                        Historial de Pagos
                    </h2>
                    <div className={estilos.tablaPagos}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Recibo</th>
                                    <th>Fecha</th>
                                    <th>Método</th>
                                    <th className={estilos.derecha}>A Mora</th>
                                    <th className={estilos.derecha}>A Interés</th>
                                    <th className={estilos.derecha}>A Capital</th>
                                    <th className={estilos.derecha}>Total</th>
                                    <th>Registrado por</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cuota.pagos.map((pago, index) => (
                                    <tr key={pago.id} style={{ animationDelay: `${index * 0.05}s` }}>
                                        <td>
                                            <span className={estilos.reciboNumero}>{pago.numero_recibo}</span>
                                        </td>
                                        <td>{formatearFechaCorta(pago.fecha_pago)}</td>
                                        <td>
                                            <span className={estilos.metodoPago}>
                                                {formatearMetodoPago(pago.metodo_pago)}
                                            </span>
                                        </td>
                                        <td className={estilos.derecha}>{formatearMoneda(pago.aplicado_mora)}</td>
                                        <td className={estilos.derecha}>{formatearMoneda(pago.aplicado_interes)}</td>
                                        <td className={estilos.derecha}>{formatearMoneda(pago.aplicado_capital)}</td>
                                        <td className={`${estilos.derecha} ${estilos.montoTotal}`}>
                                            {formatearMoneda(pago.monto_pago)}
                                        </td>
                                        <td>
                                            <span className={estilos.registradoPor}>{pago.registrado_por_nombre}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* Acciones rápidas */}
            <section className={estilos.accionesRapidas}>
                <Link href="/admin/cuotas" className={estilos.btnAccionRapida}>
                    <ion-icon name="list-outline"></ion-icon>
                    Ver todas las cuotas
                </Link>
                <Link href={`/admin/contratos/ver/${cuota.contrato_id}`} className={estilos.btnAccionRapida}>
                    <ion-icon name="document-text-outline"></ion-icon>
                    Ver contrato completo
                </Link>
                <Link href="/admin/alertas" className={estilos.btnAccionRapida}>
                    <ion-icon name="notifications-outline"></ion-icon>
                    Ver alertas
                </Link>
            </section>
        </div>
    )
}

