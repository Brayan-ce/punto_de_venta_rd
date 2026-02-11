"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { obtenerActivosListado } from './servidor'
import { eliminarActivo } from '../servidor'
import { ImagenProducto } from '@/utils/imageUtils'
import estilos from './listar.module.css'

export default function ListarActivosAdmin() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [activos, setActivos] = useState([])
    const [busqueda, setBusqueda] = useState('')
    const [filtroEstado, setFiltroEstado] = useState('todos')
    const [filtroTipoActivo, setFiltroTipoActivo] = useState('todos')
    const [procesando, setProcesando] = useState(false)
    const [vistaActual, setVistaActual] = useState('cards') // 'cards' o 'tabla'

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
        cargarActivos()
    }, [])

    const cargarActivos = async () => {
        setCargando(true)
        try {
            const resultado = await obtenerActivosListado()
            if (resultado.success) {
                setActivos(resultado.activos)
            } else {
                alert(resultado.mensaje || 'Error al cargar activos')
            }
        } catch (error) {
            console.error('Error al cargar activos:', error)
            alert('Error al cargar datos')
        } finally {
            setCargando(false)
        }
    }

    const manejarEliminar = async (activoId, numeroSerie) => {
        if (!confirm(`¿Estás seguro de dar de baja el activo con serie "${numeroSerie}"? Esta acción cambiará el estado a "Dado de Baja".`)) {
            return
        }

        setProcesando(true)
        try {
            const resultado = await eliminarActivo(activoId)
            if (resultado.success) {
                await cargarActivos()
                alert(resultado.mensaje)
            } else {
                alert(resultado.mensaje || 'Error al eliminar activo')
            }
        } catch (error) {
            console.error('Error al eliminar activo:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    const activosFiltrados = activos.filter(activo => {
        const cumpleBusqueda = busqueda === '' ||
            activo.producto_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
            activo.numero_serie?.toLowerCase().includes(busqueda.toLowerCase()) ||
            activo.vin?.toLowerCase().includes(busqueda.toLowerCase()) ||
            activo.numero_placa?.toLowerCase().includes(busqueda.toLowerCase()) ||
            activo.codigo_activo?.toLowerCase().includes(busqueda.toLowerCase()) ||
            activo.cliente_nombre?.toLowerCase().includes(busqueda.toLowerCase())

        const cumpleEstado = filtroEstado === 'todos' || activo.estado === filtroEstado
        const cumpleTipoActivo = filtroTipoActivo === 'todos' || activo.tipo_activo === filtroTipoActivo

        return cumpleBusqueda && cumpleEstado && cumpleTipoActivo
    })

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2
        }).format(monto || 0)
    }

    const obtenerTextoEstado = (estado) => {
        const textos = {
            en_stock: 'En Stock',
            vendido: 'Vendido',
            financiado: 'Financiado',
            asignado: 'Asignado',
            devuelto: 'Devuelto',
            mantenimiento: 'Mantenimiento',
            dado_baja: 'Dado de Baja'
        }
        return textos[estado] || estado
    }

    const obtenerColorEstado = (estado) => {
        const colores = {
            en_stock: 'success',
            vendido: 'info',
            financiado: 'warning',
            asignado: 'info',
            devuelto: 'secondary',
            mantenimiento: 'warning',
            dado_baja: 'danger'
        }
        return colores[estado] || 'secondary'
    }

    const obtenerEtiquetaTipoActivo = (tipo) => {
        const tipos = {
            'vehiculo': 'Vehículo',
            'electronico': 'Electrónico',
            'electrodomestico': 'Electrodoméstico',
            'mueble': 'Mueble',
            'otro': 'Otro',
            'no_rastreable': 'No Rastreable'
        }
        return tipos[tipo] || tipo
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Listado de Activos</h1>
                    <p className={estilos.subtitulo}>Gestiona todas las unidades físicas rastreables</p>
                </div>
                <div className={estilos.headerAcciones}>
                    <Link href="/admin/activos" className={estilos.btnVolver}>
                        <ion-icon name="arrow-back-outline"></ion-icon>
                        <span>Volver al Dashboard</span>
                    </Link>
                    <Link href="/admin/activos/nuevo" className={estilos.btnNuevo}>
                        <ion-icon name="add-circle-outline"></ion-icon>
                        <span>Nuevo Activo</span>
                    </Link>
                </div>
            </div>

            <div className={estilos.controles}>
                <div className={estilos.barraHerramientas}>
                    <div className={estilos.busqueda}>
                        <ion-icon name="search-outline"></ion-icon>
                        <input
                            type="text"
                            placeholder="Buscar por producto, serie, VIN, placa, código o cliente..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className={estilos.inputBusqueda}
                        />
                    </div>

                    <div className={estilos.selectoresVista}>
                        <button
                            className={`${estilos.btnVista} ${vistaActual === 'cards' ? estilos.vistaActiva : ''}`}
                            onClick={() => setVistaActual('cards')}
                            title="Vista de Tarjetas"
                        >
                            <ion-icon name="grid-outline"></ion-icon>
                        </button>
                        <button
                            className={`${estilos.btnVista} ${vistaActual === 'tabla' ? estilos.vistaActiva : ''}`}
                            onClick={() => setVistaActual('tabla')}
                            title="Vista de Tabla"
                        >
                            <ion-icon name="list-outline"></ion-icon>
                        </button>
                    </div>
                </div>

                <div className={estilos.filtros}>
                    <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        className={estilos.selectFiltro}
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="en_stock">En Stock</option>
                        <option value="vendido">Vendido</option>
                        <option value="financiado">Financiado</option>
                        <option value="asignado">Asignado</option>
                        <option value="devuelto">Devuelto</option>
                        <option value="mantenimiento">Mantenimiento</option>
                        <option value="dado_baja">Dado de Baja</option>
                    </select>

                    <select
                        value={filtroTipoActivo}
                        onChange={(e) => setFiltroTipoActivo(e.target.value)}
                        className={estilos.selectFiltro}
                    >
                        <option value="todos">Todos los tipos</option>
                        <option value="vehiculo">Vehículo</option>
                        <option value="electronico">Electrónico</option>
                        <option value="electrodomestico">Electrodoméstico</option>
                        <option value="mueble">Mueble</option>
                        <option value="otro">Otro</option>
                    </select>
                </div>
            </div>

            {cargando ? (
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando activos...</span>
                </div>
            ) : activosFiltrados.length === 0 ? (
                <div className={`${estilos.vacio} ${estilos[tema]}`}>
                    <ion-icon name="cube-outline"></ion-icon>
                    <span>No hay activos que coincidan con tu búsqueda</span>
                </div>
            ) : (
                <>
                    <div className={estilos.resultadosInfo}>
                        <span className={estilos.resultadosTexto}>
                            Mostrando {activosFiltrados.length} de {activos.length} activos
                        </span>
                    </div>
                    
                    {vistaActual === 'cards' ? (
                        <div className={estilos.grid}>
                        {activosFiltrados.map((activo) => (
                            <div key={activo.id} className={`${estilos.card} ${estilos[tema]}`}>
                                <div className={estilos.cardHeader}>
                                    <ImagenProducto
                                        src={activo.producto_imagen_url}
                                        alt={activo.producto_nombre}
                                        className={estilos.imagen}
                                        placeholder={true}
                                        placeholderClassName={estilos.imagenPlaceholder}
                                    />
                                    <span className={`${estilos.badgeEstado} ${estilos[obtenerColorEstado(activo.estado)]}`}>
                                        {obtenerTextoEstado(activo.estado)}
                                    </span>
                                </div>

                                <div className={estilos.cardBody}>
                                    <h3 className={estilos.nombreProducto}>{activo.producto_nombre}</h3>
                                    
                                    <div className={estilos.codigoInfo}>
                                        {activo.numero_serie && (
                                            <span className={estilos.codigo}>
                                                <ion-icon name="finger-print-outline"></ion-icon>
                                                {activo.numero_serie}
                                            </span>
                                        )}
                                        {activo.vin && (
                                            <span className={estilos.codigo}>
                                                <ion-icon name="car-outline"></ion-icon>
                                                {activo.vin}
                                            </span>
                                        )}
                                        {activo.numero_placa && (
                                            <span className={estilos.codigo}>
                                                <ion-icon name="document-outline"></ion-icon>
                                                {activo.numero_placa}
                                            </span>
                                        )}
                                    </div>

                                    <div className={estilos.tags}>
                                        {activo.categoria_nombre && (
                                            <span className={estilos.categoria}>{activo.categoria_nombre}</span>
                                        )}
                                        <span className={estilos.tipoActivo}>
                                            {obtenerEtiquetaTipoActivo(activo.tipo_activo)}
                                        </span>
                                    </div>

                                    <div className={estilos.precios}>
                                        <div className={estilos.precioItem}>
                                            <span className={estilos.precioLabel}>Compra:</span>
                                            <span className={estilos.precioValor}>
                                                {formatearMoneda(activo.precio_compra)}
                                            </span>
                                        </div>
                                        {activo.precio_venta && (
                                            <div className={estilos.precioItem}>
                                                <span className={estilos.precioLabel}>Venta:</span>
                                                <span className={estilos.precioVenta}>
                                                    {formatearMoneda(activo.precio_venta)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {activo.cliente_nombre && (
                                        <div className={estilos.clienteInfo}>
                                            <ion-icon name="person-outline"></ion-icon>
                                            <span>{activo.cliente_nombre} {activo.cliente_apellidos || ''}</span>
                                        </div>
                                    )}

                                    {activo.numero_contrato && (
                                        <div className={estilos.contratoInfo}>
                                            <ion-icon name="document-text-outline"></ion-icon>
                                            <span>Contrato: {activo.numero_contrato}</span>
                                        </div>
                                    )}

                                    {activo.ubicacion && (
                                        <div className={estilos.ubicacionInfo}>
                                            <ion-icon name="location-outline"></ion-icon>
                                            <span>{activo.ubicacion}</span>
                                        </div>
                                    )}
                                </div>

                                <div className={estilos.cardFooter}>
                                    <Link
                                        href={`/admin/activos/ver/${activo.id}`}
                                        className={estilos.btnIcono}
                                        title="Ver detalles"
                                    >
                                        <ion-icon name="eye-outline"></ion-icon>
                                    </Link>
                                    <Link
                                        href={`/admin/activos/editar/${activo.id}`}
                                        className={`${estilos.btnIcono} ${estilos.editar}`}
                                        title="Editar"
                                    >
                                        <ion-icon name="create-outline"></ion-icon>
                                    </Link>
                                    <button
                                        onClick={() => manejarEliminar(activo.id, activo.numero_serie)}
                                        className={`${estilos.btnIcono} ${estilos.eliminar}`}
                                        disabled={procesando || activo.estado === 'financiado' || activo.estado === 'vendido'}
                                        title={activo.estado === 'financiado' || activo.estado === 'vendido' 
                                            ? 'No se puede eliminar un activo financiado o vendido' 
                                            : 'Dar de baja'}
                                    >
                                        <ion-icon name="trash-outline"></ion-icon>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    ) : (
                        // Vista de tabla
                        <div className={estilos.tablaContenedor}>
                            <table className={`${estilos.tabla} ${estilos[tema]}`}>
                                <thead>
                                    <tr>
                                        <th>Imagen</th>
                                        <th>Producto</th>
                                        <th>Número Serie</th>
                                        <th>VIN</th>
                                        <th>Placa</th>
                                        <th>Cliente</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activosFiltrados.map((activo) => (
                                        <tr key={activo.id}>
                                            <td>
                                                <div className={estilos.tablaImagen}>
                                                    <ImagenProducto
                                                        src={activo.producto_imagen_url}
                                                        alt={activo.producto_nombre}
                                                        className={estilos.imagenTabla}
                                                        placeholder={true}
                                                        placeholderClassName={estilos.imagenPlaceholderTabla}
                                                    />
                                                </div>
                                            </td>
                                            <td>
                                                <div className={estilos.nombreCelda}>
                                                    <span className={estilos.nombrePrincipal}>{activo.producto_nombre}</span>
                                                    {activo.producto_sku && (
                                                        <span className={estilos.nombreSku}>SKU: {activo.producto_sku}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>{activo.numero_serie || '-'}</td>
                                            <td>{activo.vin || '-'}</td>
                                            <td>{activo.numero_placa || '-'}</td>
                                            <td>
                                                {activo.cliente_nombre ? (
                                                    <span>{activo.cliente_nombre} {activo.cliente_apellidos || ''}</span>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td>
                                                <span className={`${estilos.badgeEstado} ${estilos[obtenerColorEstado(activo.estado)]}`}>
                                                    {obtenerTextoEstado(activo.estado)}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={estilos.accionesTabla}>
                                                    <Link
                                                        href={`/admin/activos/ver/${activo.id}`}
                                                        className={estilos.btnTablaIcono}
                                                        title="Ver detalles"
                                                    >
                                                        <ion-icon name="eye-outline"></ion-icon>
                                                    </Link>
                                                    <Link
                                                        href={`/admin/activos/editar/${activo.id}`}
                                                        className={`${estilos.btnTablaIcono} ${estilos.editar}`}
                                                        title="Editar"
                                                    >
                                                        <ion-icon name="create-outline"></ion-icon>
                                                    </Link>
                                                    <button
                                                        onClick={() => manejarEliminar(activo.id, activo.numero_serie)}
                                                        className={`${estilos.btnTablaIcono} ${estilos.eliminar}`}
                                                        disabled={procesando || activo.estado === 'financiado' || activo.estado === 'vendido'}
                                                        title={activo.estado === 'financiado' || activo.estado === 'vendido' 
                                                            ? 'No se puede eliminar un activo financiado o vendido' 
                                                            : 'Dar de baja'}
                                                    >
                                                        <ion-icon name="trash-outline"></ion-icon>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

