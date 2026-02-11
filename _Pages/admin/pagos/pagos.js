"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { obtenerPagos, obtenerEstadisticasPagos, revertirPago } from './servidor'
import { ESTADOS_PAGO, METODOS_PAGO } from '../core/finance/estados'
import estilos from './pagos.module.css'

export default function PagosFinanciamiento() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [pagos, setPagos] = useState([])
    const [estadisticas, setEstadisticas] = useState(null)
    const [paginacion, setPaginacion] = useState({
        pagina: 1,
        limite: 50,
        total: 0,
        totalPaginas: 1
    })
    const [filtros, setFiltros] = useState({
        estado: '',
        metodo_pago: '',
        buscar: '',
        fecha_desde: '',
        fecha_hasta: ''
    })
    const [mostrarModalRevertir, setMostrarModalRevertir] = useState(false)
    const [pagoSeleccionado, setPagoSeleccionado] = useState(null)
    const [razonReversion, setRazonReversion] = useState('')
    const [procesando, setProcesando] = useState(false)

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
        cargarDatos()
    }, [paginacion.pagina, filtros])

    const cargarDatos = async () => {
        setCargando(true)
        try {
            const [resultadoPagos, resultadoEstadisticas] = await Promise.all([
                obtenerPagos({
                    pagina: paginacion.pagina,
                    limite: paginacion.limite,
                    estado: filtros.estado || undefined,
                    metodo_pago: filtros.metodo_pago || undefined,
                    buscar: filtros.buscar || undefined,
                    fecha_desde: filtros.fecha_desde || undefined,
                    fecha_hasta: filtros.fecha_hasta || undefined
                }),
                obtenerEstadisticasPagos({
                    fecha_desde: filtros.fecha_desde || undefined,
                    fecha_hasta: filtros.fecha_hasta || undefined
                })
            ])

            if (resultadoPagos.success) {
                setPagos(resultadoPagos.pagos)
                setPaginacion(resultadoPagos.paginacion)
            } else {
                alert(resultadoPagos.mensaje || 'Error al cargar pagos')
            }

            if (resultadoEstadisticas.success) {
                setEstadisticas(resultadoEstadisticas.estadisticas)
            }
        } catch (error) {
            console.error('Error al cargar datos:', error)
            alert('Error al cargar datos')
        } finally {
            setCargando(false)
        }
    }

    const formatearFecha = (fecha) => {
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

    const obtenerColorEstado = (estado) => {
        const colores = {
            registrado: 'info',
            confirmado: 'success',
            revertido: 'danger',
            rechazado: 'warning'
        }
        return colores[estado] || 'secondary'
    }

    const obtenerNombreMetodoPago = (metodo) => {
        const nombres = {
            efectivo: 'Efectivo',
            transferencia: 'Transferencia',
            tarjeta_debito: 'Tarjeta Débito',
            tarjeta_credito: 'Tarjeta Crédito',
            cheque: 'Cheque',
            mixto: 'Mixto'
        }
        return nombres[metodo] || metodo
    }

    const cambiarPagina = (nuevaPagina) => {
        setPaginacion(prev => ({ ...prev, pagina: nuevaPagina }))
    }

    const manejarCambioFiltro = (e) => {
        const { name, value } = e.target
        setFiltros(prev => ({
            ...prev,
            [name]: value
        }))
        setPaginacion(prev => ({ ...prev, pagina: 1 }))
    }

    const abrirModalRevertir = (pago) => {
        setPagoSeleccionado(pago)
        setRazonReversion('')
        setMostrarModalRevertir(true)
    }

    const cerrarModalRevertir = () => {
        setMostrarModalRevertir(false)
        setPagoSeleccionado(null)
        setRazonReversion('')
    }

    const procesarReversion = async () => {
        if (!pagoSeleccionado) return

        if (!razonReversion.trim()) {
            alert('Debe ingresar una razón para revertir el pago')
            return
        }

        setProcesando(true)
        try {
            const resultado = await revertirPago(pagoSeleccionado.id, razonReversion)

            if (resultado.success) {
                alert(resultado.mensaje || 'Pago revertido exitosamente')
                cerrarModalRevertir()
                cargarDatos()
            } else {
                alert(resultado.mensaje || 'Error al revertir pago')
            }
        } catch (error) {
            console.error('Error al revertir pago:', error)
            alert('Error al revertir pago')
        } finally {
            setProcesando(false)
        }
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando pagos...</span>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Pagos de Financiamiento</h1>
                    <p className={estilos.subtitulo}>Vista global de todos los pagos registrados</p>
                </div>
                <Link href="/admin/financiamiento" className={estilos.btnSecundario}>
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    Dashboard
                </Link>
            </div>

            {/* Estadísticas */}
            {estadisticas && (
                <div className={estilos.estadisticas}>
                    <div className={estilos.estadisticaCard}>
                        <div className={estilos.estadisticaValor}>{estadisticas.total_pagos}</div>
                        <div className={estilos.estadisticaLabel}>Total Pagos</div>
                    </div>
                    <div className={estilos.estadisticaCard}>
                        <div className={`${estilos.estadisticaValor} ${estilos.success}`}>
                            {estadisticas.pagos_confirmados}
                        </div>
                        <div className={estilos.estadisticaLabel}>Confirmados</div>
                    </div>
                    <div className={estilos.estadisticaCard}>
                        <div className={`${estilos.estadisticaValor} ${estilos.danger}`}>
                            {estadisticas.pagos_revertidos}
                        </div>
                        <div className={estilos.estadisticaLabel}>Revertidos</div>
                    </div>
                    <div className={estilos.estadisticaCard}>
                        <div className={estilos.estadisticaValor}>
                            {formatearMoneda(estadisticas.total_monto_pagado)}
                        </div>
                        <div className={estilos.estadisticaLabel}>Total Pagado</div>
                    </div>
                    <div className={estilos.estadisticaCard}>
                        <div className={estilos.estadisticaValor}>
                            {formatearMoneda(estadisticas.total_capital_pagado)}
                        </div>
                        <div className={estilos.estadisticaLabel}>Capital</div>
                    </div>
                    <div className={estilos.estadisticaCard}>
                        <div className={estilos.estadisticaValor}>
                            {formatearMoneda(estadisticas.total_interes_pagado)}
                        </div>
                        <div className={estilos.estadisticaLabel}>Interés</div>
                    </div>
                </div>
            )}

            {/* Filtros */}
            <div className={estilos.filtros}>
                <input
                    type="text"
                    placeholder="Buscar por recibo, contrato, cliente..."
                    className={estilos.inputBuscar}
                    name="buscar"
                    value={filtros.buscar}
                    onChange={manejarCambioFiltro}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            setPaginacion(prev => ({ ...prev, pagina: 1 }))
                            cargarDatos()
                        }
                    }}
                />
                <select
                    className={estilos.selectFiltro}
                    name="estado"
                    value={filtros.estado}
                    onChange={manejarCambioFiltro}
                >
                    <option value="">Todos los estados</option>
                    <option value="registrado">Registrados</option>
                    <option value="confirmado">Confirmados</option>
                    <option value="revertido">Revertidos</option>
                    <option value="rechazado">Rechazados</option>
                </select>
                <select
                    className={estilos.selectFiltro}
                    name="metodo_pago"
                    value={filtros.metodo_pago}
                    onChange={manejarCambioFiltro}
                >
                    <option value="">Todos los métodos</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta_debito">Tarjeta Débito</option>
                    <option value="tarjeta_credito">Tarjeta Crédito</option>
                    <option value="cheque">Cheque</option>
                    <option value="mixto">Mixto</option>
                </select>
                <input
                    type="date"
                    className={estilos.inputFecha}
                    name="fecha_desde"
                    value={filtros.fecha_desde}
                    onChange={manejarCambioFiltro}
                    placeholder="Desde"
                />
                <input
                    type="date"
                    className={estilos.inputFecha}
                    name="fecha_hasta"
                    value={filtros.fecha_hasta}
                    onChange={manejarCambioFiltro}
                    placeholder="Hasta"
                />
            </div>

            {/* Tabla de pagos */}
            <div className={estilos.tablaContenedor}>
                <table className={estilos.tabla}>
                    <thead>
                        <tr>
                            <th>Recibo</th>
                            <th>Fecha</th>
                            <th>Contrato</th>
                            <th>Cliente</th>
                            <th>Cuota #</th>
                            <th>Monto</th>
                            <th>Distribución</th>
                            <th>Método</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pagos.length === 0 ? (
                            <tr>
                                <td colSpan="10" className={estilos.sinDatos}>
                                    No hay pagos para mostrar
                                </td>
                            </tr>
                        ) : (
                            pagos.map((pago) => (
                                <tr key={pago.id}>
                                    <td>
                                        <div className={estilos.numeroRecibo}>
                                            {pago.numero_recibo}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={estilos.fechaPago}>
                                            {formatearFecha(pago.fecha_pago)}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={estilos.contratoNumero}>
                                            {pago.numero_contrato}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={estilos.clienteNombre}>
                                            {pago.cliente_nombre}
                                        </div>
                                        <div className={estilos.clienteDoc}>
                                            {pago.cliente_documento}
                                        </div>
                                    </td>
                                    <td className={estilos.numeroCuota}>
                                        #{pago.numero_cuota}
                                    </td>
                                    <td className={estilos.monto}>
                                        {formatearMoneda(pago.monto_pago)}
                                    </td>
                                    <td>
                                        <div className={estilos.distribucion}>
                                            {pago.aplicado_mora > 0 && (
                                                <div className={estilos.distribucionItem}>
                                                    <span className={estilos.label}>Mora:</span>
                                                    <span className={estilos.valorMora}>
                                                        {formatearMoneda(pago.aplicado_mora)}
                                                    </span>
                                                </div>
                                            )}
                                            {pago.aplicado_interes > 0 && (
                                                <div className={estilos.distribucionItem}>
                                                    <span className={estilos.label}>Int:</span>
                                                    <span className={estilos.valorInteres}>
                                                        {formatearMoneda(pago.aplicado_interes)}
                                                    </span>
                                                </div>
                                            )}
                                            {pago.aplicado_capital > 0 && (
                                                <div className={estilos.distribucionItem}>
                                                    <span className={estilos.label}>Cap:</span>
                                                    <span className={estilos.valorCapital}>
                                                        {formatearMoneda(pago.aplicado_capital)}
                                                    </span>
                                                </div>
                                            )}
                                            {pago.aplicado_futuro > 0 && (
                                                <div className={estilos.distribucionItem}>
                                                    <span className={estilos.label}>Fut:</span>
                                                    <span className={estilos.valorFuturo}>
                                                        {formatearMoneda(pago.aplicado_futuro)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={estilos.metodoPago}>
                                            {obtenerNombreMetodoPago(pago.metodo_pago)}
                                        </div>
                                        {pago.numero_referencia && (
                                            <div className={estilos.referencia}>
                                                Ref: {pago.numero_referencia}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`${estilos.badge} ${estilos[obtenerColorEstado(pago.estado)]}`}>
                                            {pago.estado}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={estilos.acciones}>
                                            <Link
                                                href={`/admin/contratos/ver/${pago.contrato_id}`}
                                                className={estilos.btnVer}
                                                title="Ver contrato"
                                            >
                                                <ion-icon name="eye-outline"></ion-icon>
                                            </Link>
                                            {pago.estado === ESTADOS_PAGO.CONFIRMADO && (
                                                <button
                                                    className={estilos.btnRevertir}
                                                    onClick={() => abrirModalRevertir(pago)}
                                                    title="Revertir pago"
                                                >
                                                    <ion-icon name="arrow-undo-outline"></ion-icon>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            {paginacion.totalPaginas > 1 && (
                <div className={estilos.paginacion}>
                    <button
                        className={estilos.btnPaginacion}
                        onClick={() => cambiarPagina(paginacion.pagina - 1)}
                        disabled={paginacion.pagina === 1}
                    >
                        <ion-icon name="chevron-back-outline"></ion-icon>
                        Anterior
                    </button>
                    <span className={estilos.infoPaginacion}>
                        Página {paginacion.pagina} de {paginacion.totalPaginas}
                    </span>
                    <button
                        className={estilos.btnPaginacion}
                        onClick={() => cambiarPagina(paginacion.pagina + 1)}
                        disabled={paginacion.pagina === paginacion.totalPaginas}
                    >
                        Siguiente
                        <ion-icon name="chevron-forward-outline"></ion-icon>
                    </button>
                </div>
            )}

            {/* Modal de Reversión */}
            {mostrarModalRevertir && (
                <div className={estilos.modalOverlay} onClick={cerrarModalRevertir}>
                    <div className={estilos.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <h2>Revertir Pago</h2>
                            <button className={estilos.btnCerrarModal} onClick={cerrarModalRevertir}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>
                        <div className={estilos.modalBody}>
                            <p className={estilos.modalAdvertencia}>
                                ¿Está seguro de revertir el pago <strong>{pagoSeleccionado?.numero_recibo}</strong>?
                            </p>
                            <p className={estilos.modalInfo}>
                                Esta acción revertirá el pago y actualizará el estado de la cuota y contrato relacionados.
                            </p>
                            <div className={estilos.formGroup}>
                                <label>Razón de reversión *</label>
                                <textarea
                                    className={estilos.textarea}
                                    value={razonReversion}
                                    onChange={(e) => setRazonReversion(e.target.value)}
                                    placeholder="Ingrese la razón de la reversión..."
                                    rows="4"
                                />
                            </div>
                        </div>
                        <div className={estilos.modalFooter}>
                            <button
                                className={estilos.btnCancelar}
                                onClick={cerrarModalRevertir}
                                disabled={procesando}
                            >
                                Cancelar
                            </button>
                            <button
                                className={estilos.btnConfirmar}
                                onClick={procesarReversion}
                                disabled={procesando || !razonReversion.trim()}
                            >
                                {procesando ? 'Procesando...' : 'Revertir Pago'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

