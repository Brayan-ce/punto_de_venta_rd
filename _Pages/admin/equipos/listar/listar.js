"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { obtenerEquiposListado, eliminarEquipo } from './servidor'
import { ImagenProducto } from '@/utils/imageUtils'
import estilos from './listar.module.css'

export default function ListarEquiposAdmin() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [equipos, setEquipos] = useState([])
    const [busqueda, setBusqueda] = useState('')
    const [filtroCategoria, setFiltroCategoria] = useState('todos')
    const [filtroMarca, setFiltroMarca] = useState('todos')
    const [filtroTipoActivo, setFiltroTipoActivo] = useState('todos')
    const [filtroEstado, setFiltroEstado] = useState('todos')
    const [categorias, setCategorias] = useState([])
    const [marcas, setMarcas] = useState([])
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
        cargarEquipos()
    }, [])

    const cargarEquipos = async () => {
        setCargando(true)
        try {
            const resultado = await obtenerEquiposListado()
            if (resultado.success) {
                setEquipos(resultado.equipos)
                setCategorias(resultado.categorias)
                setMarcas(resultado.marcas)
            } else {
                alert(resultado.mensaje || 'Error al cargar equipos')
            }
        } catch (error) {
            console.error('Error al cargar equipos:', error)
            alert('Error al cargar datos')
        } finally {
            setCargando(false)
        }
    }

    const manejarEliminar = async (equipoId, nombreEquipo) => {
        if (!confirm(`¿Estas seguro de eliminar el equipo "${nombreEquipo}"? Esta accion no se puede deshacer.`)) {
            return
        }

        setProcesando(true)
        try {
            const resultado = await eliminarEquipo(equipoId)
            if (resultado.success) {
                await cargarEquipos()
                alert(resultado.mensaje)
            } else {
                alert(resultado.mensaje || 'Error al eliminar equipo')
            }
        } catch (error) {
            console.error('Error al eliminar equipo:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    const equiposFiltrados = equipos.filter(equipo => {
        const cumpleBusqueda = busqueda === '' ||
            equipo.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            equipo.codigo_barras?.toLowerCase().includes(busqueda.toLowerCase()) ||
            equipo.sku?.toLowerCase().includes(busqueda.toLowerCase())

        const cumpleCategoria = filtroCategoria === 'todos' || equipo.categoria_id === parseInt(filtroCategoria)
        const cumpleMarca = filtroMarca === 'todos' || equipo.marca_id === parseInt(filtroMarca)
        const cumpleTipoActivo = filtroTipoActivo === 'todos' || equipo.tipo_activo === filtroTipoActivo
        const cumpleEstado = filtroEstado === 'todos' || (filtroEstado === 'activo' ? equipo.activo : !equipo.activo)

        return cumpleBusqueda && cumpleCategoria && cumpleMarca && cumpleTipoActivo && cumpleEstado
    })

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2
        }).format(monto)
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
                    <h1 className={estilos.titulo}>Listado de Equipos</h1>
                    <p className={estilos.subtitulo}>Gestiona todos tus productos rastreables y sus unidades físicas</p>
                </div>
                <div className={estilos.headerAcciones}>
                    <Link href="/admin/equipos" className={estilos.btnVolver}>
                        <ion-icon name="arrow-back-outline"></ion-icon>
                        <span>Volver al Dashboard</span>
                    </Link>
                    <Link href="/admin/equipos/nuevo" className={estilos.btnNuevo}>
                        <ion-icon name="add-circle-outline"></ion-icon>
                        <span>Nuevo Equipo</span>
                    </Link>
                </div>
            </div>

            <div className={estilos.controles}>
                <div className={estilos.barraHerramientas}>
                    <div className={estilos.busqueda}>
                        <ion-icon name="search-outline"></ion-icon>
                        <input
                            type="text"
                            placeholder="Buscar por nombre, código o SKU..."
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
                        value={filtroCategoria}
                        onChange={(e) => setFiltroCategoria(e.target.value)}
                        className={estilos.selectFiltro}
                    >
                        <option value="todos">Todas las categorías</option>
                        {categorias.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                        ))}
                    </select>

                    <select
                        value={filtroMarca}
                        onChange={(e) => setFiltroMarca(e.target.value)}
                        className={estilos.selectFiltro}
                    >
                        <option value="todos">Todas las marcas</option>
                        {marcas.map(marca => (
                            <option key={marca.id} value={marca.id}>{marca.nombre}</option>
                        ))}
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

                    <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        className={estilos.selectFiltro}
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                    </select>
                </div>
            </div>

            {cargando ? (
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando equipos...</span>
                </div>
            ) : equiposFiltrados.length === 0 ? (
                <div className={`${estilos.vacio} ${estilos[tema]}`}>
                    <ion-icon name="cube-outline"></ion-icon>
                    <span>No hay equipos que coincidan con tu búsqueda</span>
                </div>
            ) : (
                <>
                    <div className={estilos.resultadosInfo}>
                        <span className={estilos.resultadosTexto}>
                            Mostrando {equiposFiltrados.length} de {equipos.length} equipos
                        </span>
                    </div>
                    
                    {vistaActual === 'cards' ? (
                        <div className={estilos.grid}>
                        {equiposFiltrados.map((equipo) => (
                            <div key={equipo.id} className={`${estilos.card} ${estilos[tema]}`}>
                                <div className={estilos.cardHeader}>
                                    <ImagenProducto
                                        src={equipo.imagen_url}
                                        alt={equipo.nombre}
                                        className={estilos.imagen}
                                        placeholder={true}
                                        placeholderClassName={estilos.imagenPlaceholder}
                                    />
                                    {parseInt(equipo.total_activos) === 0 && (
                                        <span className={estilos.badgeSinActivos}>Sin Unidades</span>
                                    )}
                                </div>

                                <div className={estilos.cardBody}>
                                    <h3 className={estilos.nombreProducto}>{equipo.nombre}</h3>
                                    
                                    <div className={estilos.codigoInfo}>
                                        {equipo.codigo_barras && (
                                            <span className={estilos.codigo}>
                                                <ion-icon name="barcode-outline"></ion-icon>
                                                {equipo.codigo_barras}
                                            </span>
                                        )}
                                        {equipo.sku && (
                                            <span className={estilos.codigo}>
                                                <ion-icon name="pricetag-outline"></ion-icon>
                                                {equipo.sku}
                                            </span>
                                        )}
                                    </div>

                                    <div className={estilos.tags}>
                                        {equipo.categoria_nombre && (
                                            <span className={estilos.categoria}>{equipo.categoria_nombre}</span>
                                        )}
                                        <span className={estilos.tipoActivo}>
                                            {obtenerEtiquetaTipoActivo(equipo.tipo_activo)}
                                        </span>
                                    </div>

                                    <div className={estilos.precios}>
                                        <div className={estilos.precioItem}>
                                            <span className={estilos.precioLabel}>Compra:</span>
                                            <span className={estilos.precioValor}>
                                                {formatearMoneda(equipo.precio_compra)}
                                            </span>
                                        </div>
                                        <div className={estilos.precioItem}>
                                            <span className={estilos.precioLabel}>Venta:</span>
                                            <span className={estilos.precioVenta}>
                                                {formatearMoneda(equipo.precio_venta)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={estilos.activosInfo}>
                                        <div className={estilos.activosGrid}>
                                            <div className={estilos.activoItem}>
                                                <ion-icon name="checkmark-circle-outline"></ion-icon>
                                                <span className={estilos.activoLabel}>Disponibles:</span>
                                                <span className={estilos.activoValor}>{equipo.activos_disponibles || 0}</span>
                                            </div>
                                            <div className={estilos.activoItem}>
                                                <ion-icon name="card-outline"></ion-icon>
                                                <span className={estilos.activoLabel}>Financiados:</span>
                                                <span className={estilos.activoValor}>{equipo.activos_financiados || 0}</span>
                                            </div>
                                            <div className={estilos.activoItem}>
                                                <ion-icon name="checkmark-done-circle-outline"></ion-icon>
                                                <span className={estilos.activoLabel}>Vendidos:</span>
                                                <span className={estilos.activoValor}>{equipo.activos_vendidos || 0}</span>
                                            </div>
                                        </div>
                                        <div className={estilos.totalActivos}>
                                            <span className={estilos.totalLabel}>Total Unidades:</span>
                                            <span className={estilos.totalValor}>{equipo.total_activos || 0}</span>
                                        </div>
                                    </div>

                                    <div className={estilos.estado}>
                                        <span className={`${estilos.badgeEstado} ${equipo.activo ? estilos.activo : estilos.inactivo}`}>
                                            {equipo.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                </div>

                                <div className={estilos.cardFooter}>
                                    <Link
                                        href={`/admin/equipos/ver/${equipo.id}`}
                                        className={estilos.btnIcono}
                                        title="Ver detalles"
                                    >
                                        <ion-icon name="eye-outline"></ion-icon>
                                    </Link>
                                    <Link
                                        href={`/admin/equipos/editar/${equipo.id}`}
                                        className={`${estilos.btnIcono} ${estilos.editar}`}
                                        title="Editar"
                                    >
                                        <ion-icon name="create-outline"></ion-icon>
                                    </Link>
                                    <button
                                        onClick={() => manejarEliminar(equipo.id, equipo.nombre)}
                                        className={`${estilos.btnIcono} ${estilos.eliminar}`}
                                        disabled={procesando}
                                        title="Eliminar"
                                    >
                                        <ion-icon name="trash-outline"></ion-icon>
                                    </button>
                                    <Link
                                        href={`/admin/equipos/ver/${equipo.id}?accion=agregar`}
                                        className={`${estilos.btnIcono} ${estilos.agregar}`}
                                        title="Agregar activo"
                                    >
                                        <ion-icon name="add-circle-outline"></ion-icon>
                                    </Link>
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
                                        <th>Nombre</th>
                                        <th>Categoría</th>
                                        <th>Tipo</th>
                                        <th>Precio</th>
                                        <th>Stock</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {equiposFiltrados.map((equipo) => (
                                        <tr key={equipo.id}>
                                            <td>
                                                <div className={estilos.tablaImagen}>
                                                    <ImagenProducto
                                                        src={equipo.imagen_url}
                                                        alt={equipo.nombre}
                                                        className={estilos.imagenTabla}
                                                        placeholder={true}
                                                        placeholderClassName={estilos.imagenPlaceholderTabla}
                                                    />
                                                </div>
                                            </td>
                                            <td>
                                                <div className={estilos.nombreCelda}>
                                                    <span className={estilos.nombrePrincipal}>{equipo.nombre}</span>
                                                    {equipo.sku && (
                                                        <span className={estilos.nombreSku}>SKU: {equipo.sku}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={estilos.categoriaTag}>
                                                    {equipo.categoria_nombre || 'Sin categoría'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={estilos.tipoTag}>
                                                    {obtenerEtiquetaTipoActivo(equipo.tipo_activo)}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={estilos.precioCelda}>
                                                    {formatearMoneda(equipo.precio_venta)}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={estilos.stockInfo}>
                                                    <span className={`${estilos.stockBadgeTabla} ${equipo.activos_disponibles > 0 ? estilos.disponible : estilos.agotado}`}>
                                                        {equipo.activos_disponibles || 0}
                                                    </span>
                                                    <span className={estilos.stockTexto}>/ {equipo.total_activos || 0} total</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`${estilos.badgeEstado} ${equipo.activo ? estilos.activo : estilos.inactivo}`}>
                                                    {equipo.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={estilos.accionesTabla}>
                                                    <Link
                                                        href={`/admin/equipos/ver/${equipo.id}`}
                                                        className={estilos.btnTablaIcono}
                                                        title="Ver detalles"
                                                    >
                                                        <ion-icon name="eye-outline"></ion-icon>
                                                    </Link>
                                                    <Link
                                                        href={`/admin/equipos/editar/${equipo.id}`}
                                                        className={`${estilos.btnTablaIcono} ${estilos.editar}`}
                                                        title="Editar"
                                                    >
                                                        <ion-icon name="create-outline"></ion-icon>
                                                    </Link>
                                                    <Link
                                                        href={`/admin/equipos/ver/${equipo.id}?accion=agregar`}
                                                        className={`${estilos.btnTablaIcono} ${estilos.agregar}`}
                                                        title="Agregar activo"
                                                    >
                                                        <ion-icon name="add-circle-outline"></ion-icon>
                                                    </Link>
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

