"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { obtenerCompras, anularCompra } from './servidor'
import estilos from './compras.module.css'

export default function ComprasAdmin() {
    const router = useRouter()
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
                alert(resultado.mensaje || 'Error al cargar compras')
            }
        } catch (error) {
            console.error('Error al cargar compras:', error)
            alert('Error al cargar datos')
        } finally {
            setCargando(false)
        }
    }

    const manejarAnularCompra = async (compraId, ncf) => {
        const razon = prompt(`Ingresa la razon de anulacion para la compra ${ncf}:`)
        
        if (!razon || razon.trim() === '') {
            alert('Debes proporcionar una razon para anular la compra')
            return
        }

        if (!confirm(`Estas seguro de anular la compra ${ncf}? Esta accion no se puede deshacer.`)) {
            return
        }

        setProcesando(true)
        try {
            const resultado = await anularCompra(compraId)
            if (resultado.success) {
                await cargarCompras()
                alert(resultado.mensaje)
            } else {
                alert(resultado.mensaje || 'Error al anular compra')
            }
        } catch (error) {
            console.error('Error al anular compra:', error)
            alert('Error al procesar la solicitud')
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
        return new Date(fecha).toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

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
            tarjeta_debito: { texto: 'Tarjeta Debito', color: 'tarjeta' },
            tarjeta_credito: { texto: 'Tarjeta Credito', color: 'tarjeta' },
            transferencia: { texto: 'Transferencia', color: 'transferencia' },
            cheque: { texto: 'Cheque', color: 'cheque' },
            mixto: { texto: 'Mixto', color: 'mixto' }
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
                    <h1 className={estilos.titulo}>Compras</h1>
                    <p className={estilos.subtitulo}>Gestiona las compras a proveedores</p>
                </div>
                <Link href="/admin/compras/nuevo" className={estilos.btnNuevo}>
                    <ion-icon name="add-circle-outline"></ion-icon>
                    <span>Nueva Compra</span>
                </Link>
            </div>

            <div className={estilos.estadisticas}>
                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={estilos.estadIcono}>
                        <ion-icon name="bag-handle-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Total Compras</span>
                        <span className={estilos.estadValor}>{totales.totalCompras}</span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.success}`}>
                        <ion-icon name="checkmark-circle-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Recibidas</span>
                        <span className={estilos.estadValor}>{totales.totalRecibidas}</span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.danger}`}>
                        <ion-icon name="close-circle-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Anuladas</span>
                        <span className={estilos.estadValor}>{totales.totalAnuladas}</span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.primary}`}>
                        <ion-icon name="cash-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Monto Total</span>
                        <span className={estilos.estadValor}>{formatearMoneda(totales.montoTotal)}</span>
                    </div>
                </div>
            </div>

            <div className={estilos.controles}>
                <div className={estilos.busqueda}>
                    <ion-icon name="search-outline"></ion-icon>
                    <input
                        type="text"
                        placeholder="Buscar por NCF o proveedor..."
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
                        <option value="todos">Todos los proveedores</option>
                        {proveedores.map(prov => (
                            <option key={prov.id} value={prov.id}>{prov.nombre_comercial}</option>
                        ))}
                    </select>

                    <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        className={estilos.selectFiltro}
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="recibida">Recibidas</option>
                        <option value="pendiente">Pendientes</option>
                        <option value="anulada">Anuladas</option>
                    </select>

                    <select
                        value={filtroMetodo}
                        onChange={(e) => setFiltroMetodo(e.target.value)}
                        className={estilos.selectFiltro}
                    >
                        <option value="todos">Todos los metodos</option>
                        <option value="efectivo">Efectivo</option>
                        <option value="tarjeta_debito">Tarjeta Debito</option>
                        <option value="tarjeta_credito">Tarjeta Credito</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="cheque">Cheque</option>
                        <option value="mixto">Mixto</option>
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
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando compras...</span>
                </div>
            ) : comprasFiltradas.length === 0 ? (
                <div className={`${estilos.vacio} ${estilos[tema]}`}>
                    <ion-icon name="bag-handle-outline"></ion-icon>
                    <span>No hay compras que coincidan con tu busqueda</span>
                </div>
            ) : (
                <div className={`${estilos.tabla} ${estilos[tema]}`}>
                    <div className={`${estilos.tablaHeader} ${estilos[tema]}`}>
                        <div className={estilos.columna}>NCF</div>
                        <div className={estilos.columna}>Proveedor</div>
                        <div className={estilos.columna}>Metodo Pago</div>
                        <div className={estilos.columna}>Subtotal</div>
                        <div className={estilos.columna}>ITBIS</div>
                        <div className={estilos.columna}>Total</div>
                        <div className={estilos.columna}>Estado</div>
                        <div className={estilos.columna}>Fecha</div>
                        <div className={estilos.columnaAcciones}>Acciones</div>
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
                                        {compra.estado === 'recibida' ? 'Recibida' : compra.estado === 'anulada' ? 'Anulada' : 'Pendiente'}
                                    </span>
                                </div>
                                <div className={estilos.columna}>
                                    <span className={estilos.fecha}>{formatearFecha(compra.fecha_compra)}</span>
                                </div>
                                <div className={estilos.columnaAcciones}>
                                    <Link
                                        href={`/admin/compras/ver/${compra.id}`}
                                        className={estilos.btnIcono}
                                        title="Ver detalles"
                                    >
                                        <ion-icon name="eye-outline"></ion-icon>
                                    </Link>
                                    {compra.estado === 'recibida' && (
                                        <button
                                            className={`${estilos.btnIcono} ${estilos.anular}`}
                                            onClick={() => manejarAnularCompra(compra.id, compra.ncf)}
                                            disabled={procesando}
                                            title="Anular compra"
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