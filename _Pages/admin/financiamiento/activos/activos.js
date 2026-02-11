"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { obtenerActivos, crearActivo } from '../servidor'
import estilos from './activos.module.css'

export default function ActivosFinanciamiento() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [activos, setActivos] = useState([])
    const [productos, setProductos] = useState([])
    const [mostrarModal, setMostrarModal] = useState(false)
    const [filtroEstado, setFiltroEstado] = useState('')
    const [filtroProducto, setFiltroProducto] = useState('')
    const [buscar, setBuscar] = useState('')

    const [formData, setFormData] = useState({
        producto_id: '',
        codigo_activo: '',
        numero_serie: '',
        vin: '',
        numero_motor: '',
        numero_placa: '',
        color: '',
        anio_fabricacion: '',
        especificaciones_tecnicas: {},
        estado: 'en_stock',
        fecha_compra: '',
        precio_compra: '',
        ubicacion: '',
        observaciones: ''
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
        cargarActivos()
        cargarProductosRastreables()
    }, [filtroEstado, filtroProducto, buscar])

    const cargarActivos = async () => {
        setCargando(true)
        try {
            const resultado = await obtenerActivos({
                estado: filtroEstado || undefined,
                producto_id: filtroProducto || undefined,
                buscar: buscar || undefined
            })

            if (resultado.success) {
                setActivos(resultado.activos)
            } else {
                alert(resultado.mensaje || 'Error al cargar activos')
            }
        } catch (error) {
            console.error('Error al cargar activos:', error)
            alert('Error al cargar activos')
        } finally {
            setCargando(false)
        }
    }

    const cargarProductosRastreables = async () => {
        try {
            const response = await fetch('/api/productos?rastreable=true')
            const data = await response.json()
            if (data.success) {
                setProductos(data.productos)
            }
        } catch (error) {
            console.error('Error al cargar productos:', error)
        }
    }

    const abrirModalCrear = () => {
        setFormData({
            producto_id: '',
            codigo_activo: '',
            numero_serie: '',
            vin: '',
            numero_motor: '',
            numero_placa: '',
            color: '',
            anio_fabricacion: '',
            especificaciones_tecnicas: {},
            estado: 'en_stock',
            fecha_compra: '',
            precio_compra: '',
            ubicacion: '',
            observaciones: ''
        })
        setMostrarModal(true)
    }

    const cerrarModal = () => {
        setMostrarModal(false)
    }

    const manejarCambio = (e) => {
        const { name, value, type } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (value ? parseFloat(value) : '') : value
        }))
    }

    const guardarActivo = async () => {
        if (!formData.producto_id) {
            alert('Debe seleccionar un producto')
            return
        }

        try {
            const resultado = await crearActivo(formData)
            if (resultado.success) {
                alert(resultado.mensaje || 'Activo creado exitosamente')
                cerrarModal()
                cargarActivos()
            } else {
                alert(resultado.mensaje || 'Error al crear activo')
            }
        } catch (error) {
            console.error('Error al guardar activo:', error)
            alert('Error al guardar activo')
        }
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2
        }).format(monto || 0)
    }

    const formatearFecha = (fecha) => {
        if (!fecha) return 'N/A'
        return new Date(fecha).toLocaleDateString('es-DO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
    }

    const obtenerColorEstado = (estado) => {
        const colores = {
            en_stock: 'info',
            vendido: 'success',
            financiado: 'warning',
            asignado: 'info',
            devuelto: 'secondary',
            mantenimiento: 'warning',
            dado_baja: 'danger'
        }
        return colores[estado] || 'secondary'
    }

    const activosFiltrados = activos.filter(activo => {
        if (filtroEstado && activo.estado !== filtroEstado) return false
        if (filtroProducto && activo.producto_id !== parseInt(filtroProducto)) return false
        if (buscar) {
            const busqueda = buscar.toLowerCase()
            return (
                activo.numero_serie?.toLowerCase().includes(busqueda) ||
                activo.vin?.toLowerCase().includes(busqueda) ||
                activo.codigo_activo?.toLowerCase().includes(busqueda) ||
                activo.producto_nombre?.toLowerCase().includes(busqueda)
            )
        }
        return true
    })

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando activos...</span>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Gestión de Activos</h1>
                    <p className={estilos.subtitulo}>Administra activos rastreables (scooters, motos, etc.)</p>
                </div>
                <div className={estilos.headerAcciones}>
                    <Link href="/admin/financiamiento" className={estilos.btnSecundario}>
                        <ion-icon name="arrow-back-outline"></ion-icon>
                        Volver
                    </Link>
                    <button className={estilos.btnPrimario} onClick={abrirModalCrear}>
                        <ion-icon name="add-outline"></ion-icon>
                        Nuevo Activo
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className={estilos.filtros}>
                <input
                    type="text"
                    placeholder="Buscar por serie, VIN, código..."
                    className={estilos.inputBuscar}
                    value={buscar}
                    onChange={(e) => setBuscar(e.target.value)}
                />
                <select
                    className={estilos.selectFiltro}
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                >
                    <option value="">Todos los estados</option>
                    <option value="en_stock">En Stock</option>
                    <option value="vendido">Vendido</option>
                    <option value="financiado">Financiado</option>
                    <option value="asignado">Asignado</option>
                    <option value="mantenimiento">Mantenimiento</option>
                </select>
                <select
                    className={estilos.selectFiltro}
                    value={filtroProducto}
                    onChange={(e) => setFiltroProducto(e.target.value)}
                >
                    <option value="">Todos los productos</option>
                    {productos.map(prod => (
                        <option key={prod.id} value={prod.id}>{prod.nombre}</option>
                    ))}
                </select>
            </div>

            {/* Lista de activos */}
            <div className={estilos.listaActivos}>
                {activosFiltrados.length === 0 ? (
                    <div className={estilos.sinDatos}>
                        <ion-icon name="cube-outline"></ion-icon>
                        <p>No hay activos para mostrar</p>
                    </div>
                ) : (
                    activosFiltrados.map(activo => (
                        <div key={activo.id} className={estilos.activoCard}>
                            <div className={estilos.activoHeader}>
                                <div>
                                    <h3 className={estilos.activoNombre}>{activo.producto_nombre}</h3>
                                    <p className={estilos.activoCodigo}>{activo.codigo_activo}</p>
                                </div>
                                <span className={`${estilos.badge} ${estilos[obtenerColorEstado(activo.estado)]}`}>
                                    {activo.estado.replace('_', ' ')}
                                </span>
                            </div>

                            <div className={estilos.activoDetalles}>
                                {activo.numero_serie && (
                                    <div className={estilos.detalleItem}>
                                        <span className={estilos.detalleLabel}>Número de Serie:</span>
                                        <span className={estilos.detalleValor}>{activo.numero_serie}</span>
                                    </div>
                                )}
                                {activo.vin && (
                                    <div className={estilos.detalleItem}>
                                        <span className={estilos.detalleLabel}>VIN:</span>
                                        <span className={estilos.detalleValor}>{activo.vin}</span>
                                    </div>
                                )}
                                {activo.numero_placa && (
                                    <div className={estilos.detalleItem}>
                                        <span className={estilos.detalleLabel}>Placa:</span>
                                        <span className={estilos.detalleValor}>{activo.numero_placa}</span>
                                    </div>
                                )}
                                {activo.color && (
                                    <div className={estilos.detalleItem}>
                                        <span className={estilos.detalleLabel}>Color:</span>
                                        <span className={estilos.detalleValor}>{activo.color}</span>
                                    </div>
                                )}
                                {activo.anio_fabricacion && (
                                    <div className={estilos.detalleItem}>
                                        <span className={estilos.detalleLabel}>Año:</span>
                                        <span className={estilos.detalleValor}>{activo.anio_fabricacion}</span>
                                    </div>
                                )}
                                {activo.cliente_nombre && (
                                    <div className={estilos.detalleItem}>
                                        <span className={estilos.detalleLabel}>Cliente:</span>
                                        <span className={estilos.detalleValor}>{activo.cliente_nombre}</span>
                                    </div>
                                )}
                                {activo.numero_contrato && (
                                    <div className={estilos.detalleItem}>
                                        <span className={estilos.detalleLabel}>Contrato:</span>
                                        <span className={estilos.detalleValor}>{activo.numero_contrato}</span>
                                    </div>
                                )}
                                {activo.precio_compra && (
                                    <div className={estilos.detalleItem}>
                                        <span className={estilos.detalleLabel}>Precio Compra:</span>
                                        <span className={estilos.detalleValor}>
                                            {formatearMoneda(activo.precio_compra)}
                                        </span>
                                    </div>
                                )}
                                {activo.ubicacion && (
                                    <div className={estilos.detalleItem}>
                                        <span className={estilos.detalleLabel}>Ubicación:</span>
                                        <span className={estilos.detalleValor}>{activo.ubicacion}</span>
                                    </div>
                                )}
                            </div>

                            {activo.observaciones && (
                                <div className={estilos.activoObservaciones}>
                                    <strong>Observaciones:</strong>
                                    <p>{activo.observaciones}</p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Modal crear activo */}
            {mostrarModal && (
                <div className={estilos.modalOverlay} onClick={cerrarModal}>
                    <div className={estilos.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <h2>Nuevo Activo</h2>
                            <button className={estilos.btnCerrar} onClick={cerrarModal}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>

                        <div className={estilos.modalBody}>
                            <div className={estilos.formGrid}>
                                <div className={`${estilos.formGroup} ${estilos.fullWidth}`}>
                                    <label>Producto *</label>
                                    <select
                                        name="producto_id"
                                        value={formData.producto_id}
                                        onChange={manejarCambio}
                                        required
                                    >
                                        <option value="">Seleccionar producto</option>
                                        {productos.map(prod => (
                                            <option key={prod.id} value={prod.id}>{prod.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className={estilos.formGroup}>
                                    <label>Código Activo</label>
                                    <input
                                        type="text"
                                        name="codigo_activo"
                                        value={formData.codigo_activo}
                                        onChange={manejarCambio}
                                        placeholder="Se genera automáticamente si se deja vacío"
                                    />
                                </div>

                                <div className={estilos.formGroup}>
                                    <label>Número de Serie *</label>
                                    <input
                                        type="text"
                                        name="numero_serie"
                                        value={formData.numero_serie}
                                        onChange={manejarCambio}
                                        required
                                    />
                                </div>

                                <div className={estilos.formGroup}>
                                    <label>VIN</label>
                                    <input
                                        type="text"
                                        name="vin"
                                        value={formData.vin}
                                        onChange={manejarCambio}
                                        placeholder="Para vehículos"
                                    />
                                </div>

                                <div className={estilos.formGroup}>
                                    <label>Número de Motor</label>
                                    <input
                                        type="text"
                                        name="numero_motor"
                                        value={formData.numero_motor}
                                        onChange={manejarCambio}
                                    />
                                </div>

                                <div className={estilos.formGroup}>
                                    <label>Número de Placa</label>
                                    <input
                                        type="text"
                                        name="numero_placa"
                                        value={formData.numero_placa}
                                        onChange={manejarCambio}
                                    />
                                </div>

                                <div className={estilos.formGroup}>
                                    <label>Color</label>
                                    <input
                                        type="text"
                                        name="color"
                                        value={formData.color}
                                        onChange={manejarCambio}
                                    />
                                </div>

                                <div className={estilos.formGroup}>
                                    <label>Año de Fabricación</label>
                                    <input
                                        type="number"
                                        name="anio_fabricacion"
                                        value={formData.anio_fabricacion}
                                        onChange={manejarCambio}
                                        min="1900"
                                        max={new Date().getFullYear() + 1}
                                    />
                                </div>

                                <div className={estilos.formGroup}>
                                    <label>Estado</label>
                                    <select
                                        name="estado"
                                        value={formData.estado}
                                        onChange={manejarCambio}
                                    >
                                        <option value="en_stock">En Stock</option>
                                        <option value="asignado">Asignado</option>
                                        <option value="mantenimiento">Mantenimiento</option>
                                    </select>
                                </div>

                                <div className={estilos.formGroup}>
                                    <label>Fecha de Compra</label>
                                    <input
                                        type="date"
                                        name="fecha_compra"
                                        value={formData.fecha_compra}
                                        onChange={manejarCambio}
                                    />
                                </div>

                                <div className={estilos.formGroup}>
                                    <label>Precio de Compra</label>
                                    <input
                                        type="number"
                                        name="precio_compra"
                                        value={formData.precio_compra}
                                        onChange={manejarCambio}
                                        step="0.01"
                                        min="0"
                                    />
                                </div>

                                <div className={estilos.formGroup}>
                                    <label>Ubicación</label>
                                    <input
                                        type="text"
                                        name="ubicacion"
                                        value={formData.ubicacion}
                                        onChange={manejarCambio}
                                        placeholder="Bodega, Tienda, etc."
                                    />
                                </div>

                                <div className={`${estilos.formGroup} ${estilos.fullWidth}`}>
                                    <label>Observaciones</label>
                                    <textarea
                                        name="observaciones"
                                        value={formData.observaciones}
                                        onChange={manejarCambio}
                                        rows="3"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={estilos.modalFooter}>
                            <button className={estilos.btnCancelar} onClick={cerrarModal}>
                                Cancelar
                            </button>
                            <button className={estilos.btnGuardar} onClick={guardarActivo}>
                                Crear Activo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}




