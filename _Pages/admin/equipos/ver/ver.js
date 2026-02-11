"use client"
import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { obtenerDetalleEquipo, crearActivo, actualizarActivo, eliminarActivo, crearActivosMultiples } from './servidor'
import { ImagenProducto } from '@/utils/imageUtils'
import ModalActivoMejorado from './ModalActivoMejorado'
import ModalMultiplesActivos from './ModalMultiplesActivos'
import estilos from './ver.module.css'

export default function VerEquipoAdmin() {
    const router = useRouter()
    const params = useParams()
    const searchParams = useSearchParams()
    const equipoId = params.id
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [equipo, setEquipo] = useState(null)
    const [activos, setActivos] = useState([])
    const [mostrarModal, setMostrarModal] = useState(false)
    const [mostrarModalMultiple, setMostrarModalMultiple] = useState(false)
    const [activoEditando, setActivoEditando] = useState(null)
    const [procesando, setProcesando] = useState(false)
    const [filtroEstadoActivo, setFiltroEstadoActivo] = useState('todos')

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
        cargarEquipo()
        const accion = searchParams.get('accion')
        if (accion === 'agregar') {
            setTimeout(() => setMostrarModal(true), 500)
        }
    }, [equipoId])

    const cargarEquipo = async () => {
        try {
            const resultado = await obtenerDetalleEquipo(equipoId)
            if (resultado.success) {
                setEquipo(resultado.equipo)
                setActivos(resultado.activos || [])
            } else {
                alert(resultado.mensaje || 'Error al cargar equipo')
                router.push('/admin/equipos')
            }
        } catch (error) {
            console.error('Error al cargar equipo:', error)
            alert('Error al cargar datos del equipo')
            router.push('/admin/equipos')
        } finally {
            setCargando(false)
        }
    }

    const formatearMoneda = (monto) => {
        if (!monto) return 'N/A'
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2
        }).format(monto)
    }

    const formatearFecha = (fecha) => {
        if (!fecha) return 'N/A'
        return new Date(fecha).toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const obtenerEtiquetaEstado = (estado) => {
        const estados = {
            'en_stock': 'En Stock',
            'vendido': 'Vendido',
            'financiado': 'Financiado',
            'asignado': 'Asignado',
            'devuelto': 'Devuelto',
            'mantenimiento': 'Mantenimiento',
            'dado_baja': 'Dado de Baja'
        }
        return estados[estado] || estado
    }

    const obtenerIconoEstado = (estado) => {
        const iconos = {
            'en_stock': 'checkmark-circle',
            'vendido': 'cart',
            'financiado': 'card',
            'asignado': 'person',
            'devuelto': 'return-down-back',
            'mantenimiento': 'construct',
            'dado_baja': 'close-circle'
        }
        return iconos[estado] || 'ellipse'
    }

    const obtenerEtiquetaTipoActivo = (tipo) => {
        const tipos = {
            'vehiculo': 'Vehículo',
            'electronico': 'Electrónico',
            'electrodomestico': 'Electrodoméstico',
            'mueble': 'Mueble',
            'otro': 'Otro'
        }
        return tipos[tipo] || tipo
    }

    const obtenerIconoTipoActivo = (tipo) => {
        const iconos = {
            'vehiculo': 'bicycle',
            'electronico': 'laptop',
            'electrodomestico': 'tv',
            'mueble': 'bed',
            'otro': 'cube'
        }
        return iconos[tipo] || 'cube'
    }

    const abrirModalNuevo = () => {
        setActivoEditando(null)
        setMostrarModal(true)
    }

    const abrirModalEditar = (activo) => {
        setActivoEditando(activo)
        setMostrarModal(true)
    }

    const cerrarModal = () => {
        setMostrarModal(false)
        setActivoEditando(null)
    }

    const cerrarModalMultiple = () => {
        setMostrarModalMultiple(false)
    }

    const manejarGuardarActivo = async (datosActivo, activoId) => {
        setProcesando(true)
        try {
            const resultado = activoId
                ? await actualizarActivo(activoId, datosActivo)
                : await crearActivo(datosActivo)

            if (resultado.success) {
                alert(resultado.mensaje)
                cerrarModal()
                await cargarEquipo()
            } else {
                alert(resultado.mensaje || 'Error al guardar activo')
            }
        } catch (error) {
            console.error('Error al guardar activo:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    const manejarGuardarMultiples = async (activosACrear) => {
        setProcesando(true)
        try {
            const resultado = await crearActivosMultiples(activosACrear)

            if (resultado.success) {
                alert(`${resultado.cantidad} activos creados exitosamente`)
                cerrarModalMultiple()
                await cargarEquipo()
            } else {
                alert(resultado.mensaje || 'Error al crear activos')
            }
        } catch (error) {
            console.error('Error al crear activos:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    const manejarEliminarActivo = async (activoId, numeroSerie) => {
        if (!confirm(`¿Estás seguro de dar de baja el activo con número de serie "${numeroSerie}"?`)) {
            return
        }

        setProcesando(true)
        try {
            const resultado = await eliminarActivo(activoId)
            if (resultado.success) {
                alert(resultado.mensaje)
                await cargarEquipo()
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

    // Filtrar activos
    const activosFiltrados = filtroEstadoActivo === 'todos' 
        ? activos 
        : activos.filter(a => a.estado === filtroEstadoActivo)

    // Estadísticas de activos
    const estadisticasActivos = {
        total: activos.length,
        en_stock: activos.filter(a => a.estado === 'en_stock').length,
        financiado: activos.filter(a => a.estado === 'financiado').length,
        vendido: activos.filter(a => a.estado === 'vendido').length,
        mantenimiento: activos.filter(a => a.estado === 'mantenimiento').length
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <div className={estilos.spinnerContainer}>
                        <div className={estilos.spinner}></div>
                        <ion-icon name="cube-outline"></ion-icon>
                    </div>
                    <span>Cargando información del equipo...</span>
                </div>
            </div>
        )
    }

    if (!equipo) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.error}>
                    <div className={estilos.errorIcono}>
                        <ion-icon name="alert-circle-outline"></ion-icon>
                    </div>
                    <h2>Equipo no encontrado</h2>
                    <p>No se pudo cargar la información del equipo solicitado</p>
                    <button onClick={() => router.push('/admin/equipos')} className={estilos.btnVolverError}>
                        <ion-icon name="arrow-back-outline"></ion-icon>
                        <span>Volver a Equipos</span>
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* Header con breadcrumb */}
            <div className={estilos.headerWrapper}>
                <div className={estilos.breadcrumb}>
                    <Link href="/admin/equipos" className={estilos.breadcrumbLink}>
                        <ion-icon name="grid-outline"></ion-icon>
                        <span>Equipos</span>
                    </Link>
                    <ion-icon name="chevron-forward-outline" className={estilos.breadcrumbSeparator}></ion-icon>
                    <span className={estilos.breadcrumbActual}>{equipo.nombre}</span>
                </div>

                <div className={estilos.header}>
                    <div className={estilos.headerInfo}>
                        <div className={estilos.headerTituloWrapper}>
                            <h1 className={estilos.titulo}>Detalle del Equipo</h1>
                            <div className={estilos.headerBadges}>
                                <span className={`${estilos.badgeEstadoHeader} ${equipo.activo ? estilos.activo : estilos.inactivo}`}>
                                    <ion-icon name={equipo.activo ? "checkmark-circle" : "close-circle"}></ion-icon>
                                    {equipo.activo ? 'Activo' : 'Inactivo'}
                                </span>
                                <span className={estilos.badgeTipo}>
                                    <ion-icon name={obtenerIconoTipoActivo(equipo.tipo_activo)}></ion-icon>
                                    {obtenerEtiquetaTipoActivo(equipo.tipo_activo)}
                                </span>
                            </div>
                        </div>
                        <p className={estilos.subtitulo}>Información completa del equipo y gestión de unidades físicas</p>
                    </div>
                    <div className={estilos.headerAcciones}>
                        <Link href={`/admin/equipos/editar/${equipo.id}`} className={estilos.btnEditar}>
                            <ion-icon name="create-outline"></ion-icon>
                            <span>Editar Equipo</span>
                        </Link>
                        <button className={estilos.btnVolver} onClick={() => router.push('/admin/equipos')}>
                            <ion-icon name="arrow-back-outline"></ion-icon>
                            <span>Volver</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid principal */}
            <div className={estilos.gridPrincipal}>
                {/* Columna izquierda - Imagen y badges */}
                <div className={estilos.columnaImagen}>
                    <div className={`${estilos.cardImagen} ${estilos[tema]}`}>
                        <div className={estilos.imagenWrapper}>
                            <ImagenProducto
                                src={equipo.imagen_url}
                                alt={equipo.nombre}
                                className={estilos.imagen}
                                placeholder={true}
                                placeholderClassName={estilos.imagenPlaceholder}
                            />
                            {equipo.precio_oferta && (
                                <div className={estilos.badgeOferta}>
                                    <ion-icon name="pricetag"></ion-icon>
                                    OFERTA
                                </div>
                            )}
                        </div>
                        
                        {/* Mini estadísticas de stock */}
                        <div className={estilos.miniStats}>
                            <div className={`${estilos.miniStat} ${estilos.disponible}`}>
                                <ion-icon name="cube"></ion-icon>
                                <div className={estilos.miniStatInfo}>
                                    <span className={estilos.miniStatValor}>{estadisticasActivos.en_stock}</span>
                                    <span className={estilos.miniStatLabel}>Disponibles</span>
                                </div>
                            </div>
                            <div className={`${estilos.miniStat} ${estilos.financiado}`}>
                                <ion-icon name="card"></ion-icon>
                                <div className={estilos.miniStatInfo}>
                                    <span className={estilos.miniStatValor}>{estadisticasActivos.financiado}</span>
                                    <span className={estilos.miniStatLabel}>Financiados</span>
                                </div>
                            </div>
                            <div className={`${estilos.miniStat} ${estilos.vendido}`}>
                                <ion-icon name="cart"></ion-icon>
                                <div className={estilos.miniStatInfo}>
                                    <span className={estilos.miniStatValor}>{estadisticasActivos.vendido}</span>
                                    <span className={estilos.miniStatLabel}>Vendidos</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card de Configuración */}
                    <div className={`${estilos.cardConfig} ${estilos[tema]}`}>
                        <h3 className={estilos.cardTitulo}>
                            <ion-icon name="settings-outline"></ion-icon>
                            <span>Configuración</span>
                        </h3>
                        <div className={estilos.configLista}>
                            <div className={`${estilos.configItem} ${equipo.aplica_itbis ? estilos.activo : estilos.inactivo}`}>
                                <ion-icon name={equipo.aplica_itbis ? "checkmark-circle" : "close-circle"}></ion-icon>
                                <span>{equipo.aplica_itbis ? 'Aplica ITBIS' : 'No aplica ITBIS'}</span>
                            </div>
                            <div className={`${estilos.configItem} ${equipo.permite_financiamiento ? estilos.activo : estilos.inactivo}`}>
                                <ion-icon name={equipo.permite_financiamiento ? "card" : "card-outline"}></ion-icon>
                                <span>{equipo.permite_financiamiento ? 'Permite Financiamiento' : 'Sin financiamiento'}</span>
                            </div>
                            {equipo.meses_max_financiamiento && (
                                <div className={`${estilos.configItem} ${estilos.info}`}>
                                    <ion-icon name="calendar"></ion-icon>
                                    <span>Hasta {equipo.meses_max_financiamiento} meses</span>
                                </div>
                            )}
                            {equipo.meses_garantia > 0 && (
                                <div className={`${estilos.configItem} ${estilos.info}`}>
                                    <ion-icon name="shield-checkmark"></ion-icon>
                                    <span>{equipo.meses_garantia} meses de garantía</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Columna derecha - Información */}
                <div className={estilos.columnaInfo}>
                    {/* Card de información principal */}
                    <div className={`${estilos.cardInfo} ${estilos[tema]}`}>
                        <div className={estilos.infoHeader}>
                            <h2 className={estilos.nombreEquipo}>{equipo.nombre}</h2>
                            {equipo.descripcion && (
                                <p className={estilos.descripcion}>{equipo.descripcion}</p>
                            )}
                        </div>

                        <div className={estilos.infoGrid}>
                            <div className={estilos.infoItem}>
                                <div className={estilos.infoIcono}>
                                    <ion-icon name="barcode-outline"></ion-icon>
                                </div>
                                <div className={estilos.infoDetalle}>
                                    <span className={estilos.infoLabel}>Código de Barras</span>
                                    <span className={estilos.infoValor}>{equipo.codigo_barras || 'No asignado'}</span>
                                </div>
                            </div>

                            <div className={estilos.infoItem}>
                                <div className={estilos.infoIcono}>
                                    <ion-icon name="key-outline"></ion-icon>
                                </div>
                                <div className={estilos.infoDetalle}>
                                    <span className={estilos.infoLabel}>SKU</span>
                                    <span className={estilos.infoValor}>{equipo.sku || 'No asignado'}</span>
                                </div>
                            </div>

                            <div className={estilos.infoItem}>
                                <div className={estilos.infoIcono}>
                                    <ion-icon name="folder-outline"></ion-icon>
                                </div>
                                <div className={estilos.infoDetalle}>
                                    <span className={estilos.infoLabel}>Categoría</span>
                                    <span className={estilos.infoValor}>{equipo.categoria_nombre || 'Sin categoría'}</span>
                                </div>
                            </div>

                            <div className={estilos.infoItem}>
                                <div className={estilos.infoIcono}>
                                    <ion-icon name="pricetag-outline"></ion-icon>
                                </div>
                                <div className={estilos.infoDetalle}>
                                    <span className={estilos.infoLabel}>Marca</span>
                                    <span className={estilos.infoValor}>{equipo.marca_nombre || 'Sin marca'}</span>
                                </div>
                            </div>

                            <div className={estilos.infoItem}>
                                <div className={estilos.infoIcono}>
                                    <ion-icon name="resize-outline"></ion-icon>
                                </div>
                                <div className={estilos.infoDetalle}>
                                    <span className={estilos.infoLabel}>Unidad de Medida</span>
                                    <span className={estilos.infoValor}>
                                        {equipo.unidad_medida_nombre} ({equipo.unidad_medida_abreviatura})
                                    </span>
                                </div>
                            </div>

                            <div className={estilos.infoItem}>
                                <div className={estilos.infoIcono}>
                                    <ion-icon name={obtenerIconoTipoActivo(equipo.tipo_activo)}></ion-icon>
                                </div>
                                <div className={estilos.infoDetalle}>
                                    <span className={estilos.infoLabel}>Tipo de Activo</span>
                                    <span className={estilos.infoValor}>{obtenerEtiquetaTipoActivo(equipo.tipo_activo)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card de precios */}
                    <div className={`${estilos.cardPrecios} ${estilos[tema]}`}>
                        <h3 className={estilos.cardTitulo}>
                            <ion-icon name="cash-outline"></ion-icon>
                            <span>Precios</span>
                        </h3>
                        <div className={estilos.preciosGrid}>
                            <div className={estilos.precioCard}>
                                <div className={estilos.precioIcono}>
                                    <ion-icon name="trending-down-outline"></ion-icon>
                                </div>
                                <div className={estilos.precioInfo}>
                                    <span className={estilos.precioLabel}>Precio de Compra</span>
                                    <span className={estilos.precioValor}>{formatearMoneda(equipo.precio_compra)}</span>
                                </div>
                            </div>

                            <div className={`${estilos.precioCard} ${estilos.destacado}`}>
                                <div className={estilos.precioIcono}>
                                    <ion-icon name="trending-up-outline"></ion-icon>
                                </div>
                                <div className={estilos.precioInfo}>
                                    <span className={estilos.precioLabel}>Precio de Venta</span>
                                    <span className={estilos.precioValor}>{formatearMoneda(equipo.precio_venta)}</span>
                                </div>
                                <div className={estilos.precioMargen}>
                                    {equipo.precio_compra && equipo.precio_venta && (
                                        <span className={estilos.margenPorcentaje}>
                                            +{(((equipo.precio_venta - equipo.precio_compra) / equipo.precio_compra) * 100).toFixed(1)}%
                                        </span>
                                    )}
                                </div>
                            </div>

                            {equipo.precio_oferta && (
                                <div className={`${estilos.precioCard} ${estilos.oferta}`}>
                                    <div className={estilos.precioIcono}>
                                        <ion-icon name="flash-outline"></ion-icon>
                                    </div>
                                    <div className={estilos.precioInfo}>
                                        <span className={estilos.precioLabel}>Precio Oferta</span>
                                        <span className={estilos.precioValor}>{formatearMoneda(equipo.precio_oferta)}</span>
                                    </div>
                                </div>
                            )}

                            {equipo.precio_mayorista && (
                                <div className={estilos.precioCard}>
                                    <div className={estilos.precioIcono}>
                                        <ion-icon name="people-outline"></ion-icon>
                                    </div>
                                    <div className={estilos.precioInfo}>
                                        <span className={estilos.precioLabel}>Precio Mayorista</span>
                                        <span className={estilos.precioValor}>{formatearMoneda(equipo.precio_mayorista)}</span>
                                        <span className={estilos.precioNota}>Desde {equipo.cantidad_mayorista} unidades</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sección de Activos */}
            <div className={`${estilos.seccionActivos} ${estilos[tema]}`}>
                <div className={estilos.activosHeader}>
                    <div className={estilos.activosHeaderInfo}>
                        <h3 className={estilos.activosTitulo}>
                            <ion-icon name="layers-outline"></ion-icon>
                            <span>Unidades Físicas</span>
                            <span className={estilos.activosCount}>{activos.length}</span>
                        </h3>
                        <p className={estilos.activosSubtitulo}>Gestiona las unidades físicas de este equipo</p>
                    </div>
                    
                    <div className={estilos.activosControles}>
                        {/* Filtros de estado */}
                        <div className={estilos.filtrosEstado}>
                            <button 
                                className={`${estilos.filtroBtn} ${filtroEstadoActivo === 'todos' ? estilos.activo : ''}`}
                                onClick={() => setFiltroEstadoActivo('todos')}
                            >
                                Todos
                            </button>
                            <button 
                                className={`${estilos.filtroBtn} ${filtroEstadoActivo === 'en_stock' ? estilos.activo : ''}`}
                                onClick={() => setFiltroEstadoActivo('en_stock')}
                            >
                                <ion-icon name="checkmark-circle"></ion-icon>
                                Disponibles
                            </button>
                            <button 
                                className={`${estilos.filtroBtn} ${filtroEstadoActivo === 'financiado' ? estilos.activo : ''}`}
                                onClick={() => setFiltroEstadoActivo('financiado')}
                            >
                                <ion-icon name="card"></ion-icon>
                                Financiados
                            </button>
                        </div>

                        {/* Botones de agregar */}
                        <div className={estilos.botonesAgregar}>
                            <button className={estilos.btnAgregarUno} onClick={abrirModalNuevo}>
                                <ion-icon name="add-circle-outline"></ion-icon>
                                <span>Agregar Unidad</span>
                            </button>
                            <button className={estilos.btnAgregarVarios} onClick={() => setMostrarModalMultiple(true)}>
                                <ion-icon name="albums-outline"></ion-icon>
                                <span>Agregar Múltiples</span>
                            </button>
                        </div>
                    </div>
                </div>

                {activosFiltrados.length === 0 ? (
                    <div className={estilos.activosVacio}>
                        <div className={estilos.vacioIcono}>
                            <ion-icon name="cube-outline"></ion-icon>
                        </div>
                        <h4>No hay unidades registradas</h4>
                        <p>
                            {filtroEstadoActivo === 'todos' 
                                ? 'Agrega la primera unidad física de este equipo'
                                : `No hay unidades con estado "${obtenerEtiquetaEstado(filtroEstadoActivo)}"`}
                        </p>
                        {filtroEstadoActivo === 'todos' && (
                            <button className={estilos.btnAgregarVacio} onClick={abrirModalNuevo}>
                                <ion-icon name="add-circle-outline"></ion-icon>
                                <span>Agregar Primera Unidad</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Vista de tabla para desktop */}
                        <div className={estilos.tablaWrapper}>
                            <table className={estilos.tablaActivos}>
                                <thead>
                                    <tr>
                                        <th>
                                            <ion-icon name="qr-code-outline"></ion-icon>
                                            Código
                                        </th>
                                        <th>
                                            <ion-icon name="finger-print-outline"></ion-icon>
                                            Número de Serie
                                        </th>
                                        <th>
                                            <ion-icon name="car-outline"></ion-icon>
                                            VIN
                                        </th>
                                        <th>
                                            <ion-icon name="color-palette-outline"></ion-icon>
                                            Color
                                        </th>
                                        <th>
                                            <ion-icon name="calendar-outline"></ion-icon>
                                            Año
                                        </th>
                                        <th>
                                            <ion-icon name="flag-outline"></ion-icon>
                                            Estado
                                        </th>
                                        <th>
                                            <ion-icon name="person-outline"></ion-icon>
                                            Cliente
                                        </th>
                                        <th>
                                            <ion-icon name="location-outline"></ion-icon>
                                            Ubicación
                                        </th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activosFiltrados.map((activo, index) => (
                                        <tr key={activo.id} className={estilos.filaActivo} style={{ animationDelay: `${index * 0.05}s` }}>
                                            <td>
                                                <span className={estilos.codigoActivo}>{activo.codigo_activo || 'N/A'}</span>
                                            </td>
                                            <td>
                                                <span className={estilos.serieActivo}>{activo.numero_serie}</span>
                                            </td>
                                            <td>
                                                <span className={estilos.vinActivo}>{activo.vin || '—'}</span>
                                            </td>
                                            <td>
                                                {activo.color ? (
                                                    <span className={estilos.colorActivo}>
                                                        <span className={estilos.colorDot} style={{ backgroundColor: activo.color.toLowerCase() }}></span>
                                                        {activo.color}
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td>
                                                <span className={estilos.anioActivo}>{activo.anio_fabricacion || '—'}</span>
                                            </td>
                                            <td>
                                                <span className={`${estilos.badgeEstado} ${estilos[activo.estado]}`}>
                                                    <ion-icon name={obtenerIconoEstado(activo.estado)}></ion-icon>
                                                    {obtenerEtiquetaEstado(activo.estado)}
                                                </span>
                                            </td>
                                            <td>
                                                {activo.cliente_nombre ? (
                                                    <span className={estilos.clienteActivo}>
                                                        <ion-icon name="person-circle-outline"></ion-icon>
                                                        {activo.cliente_nombre}
                                                    </span>
                                                ) : (
                                                    <span className={estilos.sinCliente}>Sin asignar</span>
                                                )}
                                            </td>
                                            <td>
                                                {activo.ubicacion ? (
                                                    <span className={estilos.ubicacionActivo}>
                                                        <ion-icon name="location"></ion-icon>
                                                        {activo.ubicacion}
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td>
                                                <div className={estilos.accionesActivo}>
                                                    <button
                                                        className={`${estilos.btnAccion} ${estilos.editar}`}
                                                        onClick={() => abrirModalEditar(activo)}
                                                        title="Editar activo"
                                                    >
                                                        <ion-icon name="create-outline"></ion-icon>
                                                    </button>
                                                    <button
                                                        className={`${estilos.btnAccion} ${estilos.eliminar}`}
                                                        onClick={() => manejarEliminarActivo(activo.id, activo.numero_serie)}
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

                        {/* Vista de cards para móvil */}
                        <div className={estilos.cardsActivosMobile}>
                            {activosFiltrados.map((activo, index) => (
                                <div 
                                    key={activo.id} 
                                    className={`${estilos.cardActivoMobile} ${estilos[tema]}`}
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                    <div className={estilos.cardActivoHeader}>
                                        <div className={estilos.cardActivoSerie}>
                                            <ion-icon name="finger-print-outline"></ion-icon>
                                            <span>{activo.numero_serie}</span>
                                        </div>
                                        <span className={`${estilos.badgeEstadoMobile} ${estilos[activo.estado]}`}>
                                            <ion-icon name={obtenerIconoEstado(activo.estado)}></ion-icon>
                                            {obtenerEtiquetaEstado(activo.estado)}
                                        </span>
                                    </div>
                                    
                                    <div className={estilos.cardActivoBody}>
                                        <div className={estilos.cardActivoInfo}>
                                            {activo.color && (
                                                <div className={estilos.cardActivoItem}>
                                                    <span className={estilos.colorDotMobile} style={{ backgroundColor: activo.color.toLowerCase() }}></span>
                                                    <span>{activo.color}</span>
                                                </div>
                                            )}
                                            {activo.anio_fabricacion && (
                                                <div className={estilos.cardActivoItem}>
                                                    <ion-icon name="calendar-outline"></ion-icon>
                                                    <span>{activo.anio_fabricacion}</span>
                                                </div>
                                            )}
                                            {activo.vin && (
                                                <div className={estilos.cardActivoItem}>
                                                    <ion-icon name="car-outline"></ion-icon>
                                                    <span className={estilos.vinMobile}>{activo.vin}</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {activo.cliente_nombre && (
                                            <div className={estilos.cardActivoCliente}>
                                                <ion-icon name="person-circle-outline"></ion-icon>
                                                <span>{activo.cliente_nombre}</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className={estilos.cardActivoFooter}>
                                        <button
                                            className={`${estilos.btnAccionMobile} ${estilos.editar}`}
                                            onClick={() => abrirModalEditar(activo)}
                                        >
                                            <ion-icon name="create-outline"></ion-icon>
                                            <span>Editar</span>
                                        </button>
                                        <button
                                            className={`${estilos.btnAccionMobile} ${estilos.eliminar}`}
                                            onClick={() => manejarEliminarActivo(activo.id, activo.numero_serie)}
                                            disabled={procesando || activo.estado === 'financiado' || activo.estado === 'vendido'}
                                        >
                                            <ion-icon name="trash-outline"></ion-icon>
                                            <span>Eliminar</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Modal único activo */}
            {mostrarModal && (
                <ModalActivoMejorado
                    activoEditando={activoEditando}
                    equipo={equipo}
                    tema={tema}
                    onCerrar={cerrarModal}
                    onGuardar={manejarGuardarActivo}
                    procesando={procesando}
                />
            )}

            {/* Modal múltiples activos */}
            {mostrarModalMultiple && (
                <ModalMultiplesActivos
                    equipo={equipo}
                    tema={tema}
                    onCerrar={cerrarModalMultiple}
                    onGuardarMultiples={manejarGuardarMultiples}
                    procesando={procesando}
                />
            )}
        </div>
    )
}
