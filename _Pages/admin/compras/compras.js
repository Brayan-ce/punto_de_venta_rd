"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { obtenerCompras, anularCompra } from './servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './compras.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function ComprasAdmin() {
    const router = useRouter()
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [compras, setCompras] = useState([])
    const [proveedores, setProveedores] = useState([])
    const [busqueda, setBusqueda] = useState('')
    const [filtroProveedor, setFiltroProveedor] = useState('todos')
    const [filtroEstado, setFiltroEstado] = useState('todos')
    const [filtroMetodo, setFiltroMetodo] = useState('todos')
    const [fechaInicio, setFechaInicio] = useState('')
    const [fechaFin, setFechaFin] = useState('')

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
        cargarCompras()
    }, [])

    const cargarCompras = async () => {
        setCargando(true)
        try {
            const resultado = await obtenerCompras()
            if (resultado.success) {
                setCompras(resultado.compras)
                setProveedores(resultado.proveedores)
            } else {
                alert(resultado.mensaje || tr('Error al cargar compras', 'Error loading purchases'))
            }
        } catch (error) {
            console.error('Error al cargar compras:', error)
            alert(tr('Error al cargar datos', 'Error loading data'))
        } finally {
            setCargando(false)
        }
    }

    const manejarAnularCompra = async (compraId, ncf) => {
        const razon = prompt(tr(`Ingresa la razon de anulacion para la compra ${ncf}:`, `Enter cancellation reason for purchase ${ncf}:`))
        
        if (!razon || razon.trim() === '') {
            alert(tr('Debes proporcionar una razon para anular la compra', 'You must provide a reason to cancel this purchase'))
            return
        }

        if (!confirm(tr(`Estas seguro de anular la compra ${ncf}? Esta accion no se puede deshacer.`, `Are you sure you want to cancel purchase ${ncf}? This action cannot be undone.`))) {
            return
        }

        setProcesando(true)
        try {
            const resultado = await anularCompra(compraId)
            if (resultado.success) {
                await cargarCompras()
                alert(resultado.mensaje)
            } else {
                alert(resultado.mensaje || tr('Error al anular compra', 'Error canceling purchase'))
            }
        } catch (error) {
            console.error('Error al anular compra:', error)
            alert(tr('Error al procesar la solicitud', 'Error processing request'))
        } finally {
            setProcesando(false)
        }
    }

    const comprasFiltradas = compras.filter(compra => {
        const cumpleBusqueda = busqueda === '' ||
            compra.ncf.toLowerCase().includes(busqueda.toLowerCase()) ||
            compra.proveedor_nombre.toLowerCase().includes(busqueda.toLowerCase())

        const cumpleProveedor = filtroProveedor === 'todos' || compra.proveedor_id === parseInt(filtroProveedor)
        const cumpleEstado = filtroEstado === 'todos' || compra.estado === filtroEstado
        const cumpleMetodo = filtroMetodo === 'todos' || compra.metodo_pago === filtroMetodo

        let cumpleFecha = true
        if (fechaInicio && fechaFin) {
            const fechaCompra = new Date(compra.fecha_compra).toISOString().split('T')[0]
            cumpleFecha = fechaCompra >= fechaInicio && fechaCompra <= fechaFin
        }

        return cumpleBusqueda && cumpleProveedor && cumpleEstado && cumpleMetodo && cumpleFecha
    })

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat(language === 'en' ? 'en-US' : 'es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2
        }).format(monto)
    }

    const getMetodoPagoBadge = (metodo) => {
        const metodos = {
            efectivo: { texto: tr('Efectivo', 'Cash'), color: 'efectivo' },
            tarjeta_debito: { texto: tr('Tarjeta Debito', 'Debit Card'), color: 'tarjeta' },
            tarjeta_credito: { texto: tr('Tarjeta Credito', 'Credit Card'), color: 'tarjeta' },
            transferencia: { texto: tr('Transferencia', 'Transfer'), color: 'transferencia' },
            cheque: { texto: tr('Cheque', 'Check'), color: 'cheque' },
            mixto: { texto: tr('Mixto', 'Mixed'), color: 'mixto' }
        }
        return metodos[metodo] || metodos.efectivo
    }

    const calcularTotales = () => {
        const totales = {
            totalCompras: 0,
            totalRecibidas: 0,
            totalAnuladas: 0,
            montoTotal: 0
        }

        comprasFiltradas.forEach(compra => {
            totales.totalCompras++
            if (compra.estado === 'recibida') {
                totales.totalRecibidas++
                totales.montoTotal += parseFloat(compra.total)
            } else if (compra.estado === 'anulada') {
                totales.totalAnuladas++
            }
        })

        return totales
    }

    const totales = calcularTotales()

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>{tr('Compras', 'Purchases')}</h1>
                    <p className={estilos.subtitulo}>{tr('Gestiona las compras a proveedores', 'Manage purchases from suppliers')}</p>
                </div>
                <Link href="/admin/compras/nuevo" className={estilos.btnNuevo}>
                    <ion-icon name="add-circle-outline"></ion-icon>
                    <span>{tr('Nueva Compra', 'New Purchase')}</span>
                </Link>
            </div>

            <div className={estilos.estadisticas}>
                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={estilos.estadIcono}>
                        <ion-icon name="bag-handle-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>{tr('Total Compras', 'Total Purchases')}</span>
                        <span className={estilos.estadValor}>{totales.totalCompras}</span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.success}`}>
                        <ion-icon name="checkmark-circle-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>{tr('Recibidas', 'Received')}</span>
                        <span className={estilos.estadValor}>{totales.totalRecibidas}</span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.danger}`}>
                        <ion-icon name="close-circle-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>{tr('Anuladas', 'Canceled')}</span>
                        <span className={estilos.estadValor}>{totales.totalAnuladas}</span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.primary}`}>
                        <ion-icon name="cash-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>{tr('Monto Total', 'Total Amount')}</span>
                        <span className={estilos.estadValor}>{formatearMoneda(totales.montoTotal)}</span>
                    </div>
                </div>
            </div>

            <div className={estilos.controles}>
                <div className={estilos.busqueda}>
                    <ion-icon name="search-outline"></ion-icon>
                    <input
                        type="text"
                        placeholder={tr('Buscar por NCF o proveedor...', 'Search by NCF or supplier...')}
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className={estilos.inputBusqueda}
                    />
                </div>

                <div className={estilos.filtros}>
                    <select
                        value={filtroProveedor}
                        onChange={(e) => setFiltroProveedor(e.target.value)}
                        className={estilos.selectFiltro}
                    >
                        <option value="todos">{tr('Todos los proveedores', 'All suppliers')}</option>
                        {proveedores.map(prov => (
                            <option key={prov.id} value={prov.id}>{prov.nombre_comercial}</option>
                        ))}
                    </select>

                    <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        className={estilos.selectFiltro}
                    >
                        <option value="todos">{tr('Todos los estados', 'All statuses')}</option>
                        <option value="recibida">{tr('Recibidas', 'Received')}</option>
                        <option value="pendiente">{tr('Pendientes', 'Pending')}</option>
                        <option value="anulada">{tr('Anuladas', 'Canceled')}</option>
                    </select>

                    <select
                        value={filtroMetodo}
                        onChange={(e) => setFiltroMetodo(e.target.value)}
                        className={estilos.selectFiltro}
                    >
                        <option value="todos">{tr('Todos los metodos', 'All methods')}</option>
                        <option value="efectivo">{tr('Efectivo', 'Cash')}</option>
                        <option value="tarjeta_debito">{tr('Tarjeta Debito', 'Debit Card')}</option>
                        <option value="tarjeta_credito">{tr('Tarjeta Credito', 'Credit Card')}</option>
                        <option value="transferencia">{tr('Transferencia', 'Transfer')}</option>
                        <option value="cheque">{tr('Cheque', 'Check')}</option>
                        <option value="mixto">{tr('Mixto', 'Mixed')}</option>
                    </select>

                    <input
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        className={estilos.inputFecha}
                    />

                    <input
                        type="date"
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                        className={estilos.inputFecha}
                    />
                </div>
            </div>

            {cargando ? (
                <LoadingScreen />
            ) : comprasFiltradas.length === 0 ? (
                <div className={`${estilos.vacio} ${estilos[tema]}`}>
                    <ion-icon name="bag-handle-outline"></ion-icon>
                        <span>{tr('No hay compras que coincidan con tu busqueda', 'No purchases match your search')}</span>
                </div>
            ) : (
                <div className={`${estilos.tabla} ${estilos[tema]}`}>
                    <div className={`${estilos.tablaHeader} ${estilos[tema]}`}>
                        <div className={estilos.columna}>NCF</div>
                        <div className={estilos.columna}>{tr('Proveedor', 'Supplier')}</div>
                        <div className={estilos.columna}>{tr('Metodo Pago', 'Payment Method')}</div>
                        <div className={estilos.columna}>{tr('Subtotal', 'Subtotal')}</div>
                        <div className={estilos.columna}>ITBIS</div>
                        <div className={estilos.columna}>{tr('Total', 'Total')}</div>
                        <div className={estilos.columna}>{tr('Estado', 'Status')}</div>
                        <div className={estilos.columna}>{tr('Fecha', 'Date')}</div>
                        <div className={estilos.columnaAcciones}>{tr('Acciones', 'Actions')}</div>
                    </div>

                    <div className={estilos.tablaBody}>
                        {comprasFiltradas.map((compra) => (
                            <div key={compra.id} className={`${estilos.fila} ${estilos[tema]}`}>
                                <div className={estilos.columna}>
                                    <span className={estilos.ncf}>{compra.ncf}</span>
                                </div>
                                <div className={estilos.columna}>
                                    <span className={estilos.proveedor}>{compra.proveedor_nombre}</span>
                                </div>
                                <div className={estilos.columna}>
                                    <span className={`${estilos.badgeMetodo} ${estilos[getMetodoPagoBadge(compra.metodo_pago).color]}`}>
                                        {getMetodoPagoBadge(compra.metodo_pago).texto}
                                    </span>
                                </div>
                                <div className={estilos.columna}>
                                    <span className={estilos.monto}>{formatearMoneda(compra.subtotal)}</span>
                                </div>
                                <div className={estilos.columna}>
                                    <span className={estilos.monto}>{formatearMoneda(compra.itbis)}</span>
                                </div>
                                <div className={estilos.columna}>
                                    <span className={estilos.montoTotal}>{formatearMoneda(compra.total)}</span>
                                </div>
                                <div className={estilos.columna}>
                                    <span className={`${estilos.badgeEstado} ${estilos[compra.estado]}`}>
                                        {compra.estado === 'recibida' ? tr('Recibida', 'Received') : compra.estado === 'anulada' ? tr('Anulada', 'Canceled') : tr('Pendiente', 'Pending')}
                                    </span>
                                </div>
                                <div className={estilos.columna}>
                                    <span className={estilos.fecha}>{formatearFecha(compra.fecha_compra)}</span>
                                </div>
                                <div className={estilos.columnaAcciones}>
                                    <Link
                                        href={`/admin/compras/ver/${compra.id}`}
                                        className={estilos.btnIcono}
                                        title={tr('Ver detalles', 'View details')}
                                    >
                                        <ion-icon name="eye-outline"></ion-icon>
                                    </Link>
                                    {compra.estado === 'recibida' && (
                                        <button
                                            className={`${estilos.btnIcono} ${estilos.anular}`}
                                            onClick={() => manejarAnularCompra(compra.id, compra.ncf)}
                                            disabled={procesando}
                                            title={tr('Anular compra', 'Cancel purchase')}
                                        >
                                            <ion-icon name="close-circle-outline"></ion-icon>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}