"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerProveedores, obtenerProveedor, crearProveedor, actualizarProveedor, eliminarProveedor } from './servidor'
import estilos from './proveedores.module.css'

export default function ProveedoresAdmin() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [proveedores, setProveedores] = useState([])
    const [busqueda, setBusqueda] = useState('')
    const [filtroEstado, setFiltroEstado] = useState('todos')
    
    const [vistaActual, setVistaActual] = useState('listado')
    const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null)
    const [modoEdicion, setModoEdicion] = useState(false)

    const [formData, setFormData] = useState({
        rnc: '',
        razon_social: '',
        nombre_comercial: '',
        actividad_economica: '',
        contacto: '',
        telefono: '',
        email: '',
        direccion: '',
        sector: '',
        municipio: '',
        provincia: '',
        sitio_web: '',
        condiciones_pago: '',
        activo: true
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
        cargarProveedores()
    }, [])

    const cargarProveedores = async () => {
        setCargando(true)
        try {
            const resultado = await obtenerProveedores()
            if (resultado.success) {
                setProveedores(resultado.proveedores)
            } else {
                alert(resultado.mensaje || 'Error al cargar proveedores')
            }
        } catch (error) {
            console.error('Error al cargar proveedores:', error)
            alert('Error al cargar datos')
        } finally {
            setCargando(false)
        }
    }

    const limpiarFormulario = () => {
        setFormData({
            rnc: '',
            razon_social: '',
            nombre_comercial: '',
            actividad_economica: '',
            contacto: '',
            telefono: '',
            email: '',
            direccion: '',
            sector: '',
            municipio: '',
            provincia: '',
            sitio_web: '',
            condiciones_pago: '',
            activo: true
        })
        setModoEdicion(false)
        setProveedorSeleccionado(null)
    }

    const abrirFormularioNuevo = () => {
        limpiarFormulario()
        setVistaActual('formulario')
    }

    const abrirFormularioEditar = async (proveedor) => {
        setFormData({
            rnc: proveedor.rnc,
            razon_social: proveedor.razon_social,
            nombre_comercial: proveedor.nombre_comercial,
            actividad_economica: proveedor.actividad_economica || '',
            contacto: proveedor.contacto || '',
            telefono: proveedor.telefono || '',
            email: proveedor.email || '',
            direccion: proveedor.direccion || '',
            sector: proveedor.sector || '',
            municipio: proveedor.municipio || '',
            provincia: proveedor.provincia || '',
            sitio_web: proveedor.sitio_web || '',
            condiciones_pago: proveedor.condiciones_pago || '',
            activo: proveedor.activo
        })
        setProveedorSeleccionado(proveedor)
        setModoEdicion(true)
        setVistaActual('formulario')
    }

    const abrirDetalles = async (id) => {
        setProcesando(true)
        try {
            const resultado = await obtenerProveedor(id)
            if (resultado.success) {
                setProveedorSeleccionado(resultado.proveedor)
                setVistaActual('detalles')
            } else {
                alert(resultado.mensaje || 'Error al cargar proveedor')
            }
        } catch (error) {
            console.error('Error al cargar proveedor:', error)
            alert('Error al cargar datos')
        } finally {
            setProcesando(false)
        }
    }

    const volverListado = () => {
        setVistaActual('listado')
        limpiarFormulario()
        setProveedorSeleccionado(null)
    }

    const manejarCambio = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const validarFormulario = () => {
        if (!formData.rnc.trim()) {
            alert('El RNC es obligatorio')
            return false
        }

        if (formData.rnc.length < 9) {
            alert('El RNC debe tener al menos 9 caracteres')
            return false
        }

        if (!formData.razon_social.trim()) {
            alert('La razon social es obligatoria')
            return false
        }

        if (!formData.nombre_comercial.trim()) {
            alert('El nombre comercial es obligatorio')
            return false
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            alert('El email no es valido')
            return false
        }

        return true
    }

    const manejarSubmit = async (e) => {
        e.preventDefault()

        if (!validarFormulario()) return

        setProcesando(true)
        try {
            let resultado

            if (modoEdicion) {
                resultado = await actualizarProveedor(proveedorSeleccionado.id, formData)
            } else {
                resultado = await crearProveedor(formData)
            }

            if (resultado.success) {
                alert(resultado.mensaje)
                await cargarProveedores()
                volverListado()
            } else {
                alert(resultado.mensaje || 'Error al guardar proveedor')
            }
        } catch (error) {
            console.error('Error al guardar proveedor:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    const manejarEliminar = async (id, nombre) => {
        if (!confirm(`¿Estas seguro de eliminar el proveedor "${nombre}"?`)) {
            return
        }

        setProcesando(true)
        try {
            const resultado = await eliminarProveedor(id)
            if (resultado.success) {
                await cargarProveedores()
                alert(resultado.mensaje)
                if (vistaActual === 'detalles') {
                    volverListado()
                }
            } else {
                alert(resultado.mensaje || 'Error al eliminar proveedor')
            }
        } catch (error) {
            console.error('Error al eliminar proveedor:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    const proveedoresFiltrados = proveedores.filter(proveedor => {
        const cumpleBusqueda = busqueda === '' ||
            proveedor.nombre_comercial.toLowerCase().includes(busqueda.toLowerCase()) ||
            proveedor.razon_social.toLowerCase().includes(busqueda.toLowerCase()) ||
            proveedor.rnc.includes(busqueda)

        const cumpleEstado = filtroEstado === 'todos' || 
            (filtroEstado === 'activos' && proveedor.activo) ||
            (filtroEstado === 'inactivos' && !proveedor.activo)

        return cumpleBusqueda && cumpleEstado
    })

    const calcularEstadisticas = () => {
        const total = proveedores.length
        const activos = proveedores.filter(p => p.activo).length
        const inactivos = proveedores.filter(p => !p.activo).length

        return { total, activos, inactivos }
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2
        }).format(monto)
    }

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const estadisticas = calcularEstadisticas()

    if (vistaActual === 'formulario') {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.header}>
                    <div>
                        <h1 className={estilos.titulo}>{modoEdicion ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h1>
                        <p className={estilos.subtitulo}>{modoEdicion ? 'Modifica los datos del proveedor' : 'Registra un nuevo proveedor'}</p>
                    </div>
                    <button
                        type="button"
                        onClick={volverListado}
                        className={estilos.btnVolver}
                        disabled={procesando}
                    >
                        <ion-icon name="arrow-back-outline"></ion-icon>
                        <span>Volver</span>
                    </button>
                </div>

                <form onSubmit={manejarSubmit} className={estilos.formulario}>
                    <div className={`${estilos.panel} ${estilos[tema]}`}>
                        <h2 className={estilos.panelTitulo}>Informacion Basica</h2>
                        
                        <div className={estilos.grid}>
                            <div className={estilos.grupoInput}>
                                <label>RNC *</label>
                                <input
                                    type="text"
                                    name="rnc"
                                    value={formData.rnc}
                                    onChange={manejarCambio}
                                    className={estilos.input}
                                    placeholder="000000000"
                                    required
                                    disabled={procesando}
                                    maxLength="11"
                                />
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>Nombre Comercial *</label>
                                <input
                                    type="text"
                                    name="nombre_comercial"
                                    value={formData.nombre_comercial}
                                    onChange={manejarCambio}
                                    className={estilos.input}
                                    placeholder="Ej: Distribuidora XYZ"
                                    required
                                    disabled={procesando}
                                />
                            </div>
                        </div>

                        <div className={estilos.grupoInput}>
                            <label>Razon Social *</label>
                            <input
                                type="text"
                                name="razon_social"
                                value={formData.razon_social}
                                onChange={manejarCambio}
                                className={estilos.input}
                                placeholder="Ej: Distribuidora XYZ SRL"
                                required
                                disabled={procesando}
                            />
                        </div>

                        <div className={estilos.grupoInput}>
                            <label>Actividad Economica</label>
                            <input
                                type="text"
                                name="actividad_economica"
                                value={formData.actividad_economica}
                                onChange={manejarCambio}
                                className={estilos.input}
                                placeholder="Ej: Distribucion de alimentos"
                                disabled={procesando}
                            />
                        </div>

                        <div className={estilos.grupoCheckbox}>
                            <input
                                type="checkbox"
                                name="activo"
                                id="activo"
                                checked={formData.activo}
                                onChange={manejarCambio}
                                disabled={procesando}
                            />
                            <label htmlFor="activo">Proveedor activo</label>
                        </div>
                    </div>

                    <div className={`${estilos.panel} ${estilos[tema]}`}>
                        <h2 className={estilos.panelTitulo}>Informacion de Contacto</h2>
                        
                        <div className={estilos.grid}>
                            <div className={estilos.grupoInput}>
                                <label>Persona de Contacto</label>
                                <input
                                    type="text"
                                    name="contacto"
                                    value={formData.contacto}
                                    onChange={manejarCambio}
                                    className={estilos.input}
                                    placeholder="Ej: Juan Perez"
                                    disabled={procesando}
                                />
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>Telefono</label>
                                <input
                                    type="tel"
                                    name="telefono"
                                    value={formData.telefono}
                                    onChange={manejarCambio}
                                    className={estilos.input}
                                    placeholder="809-000-0000"
                                    disabled={procesando}
                                />
                            </div>
                        </div>

                        <div className={estilos.grid}>
                            <div className={estilos.grupoInput}>
                                <label>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={manejarCambio}
                                    className={estilos.input}
                                    placeholder="contacto@ejemplo.com"
                                    disabled={procesando}
                                />
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>Sitio Web</label>
                                <input
                                    type="url"
                                    name="sitio_web"
                                    value={formData.sitio_web}
                                    onChange={manejarCambio}
                                    className={estilos.input}
                                    placeholder="https://ejemplo.com"
                                    disabled={procesando}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={`${estilos.panel} ${estilos[tema]}`}>
                        <h2 className={estilos.panelTitulo}>Ubicacion</h2>
                        
                        <div className={estilos.grupoInput}>
                            <label>Direccion</label>
                            <input
                                type="text"
                                name="direccion"
                                value={formData.direccion}
                                onChange={manejarCambio}
                                className={estilos.input}
                                placeholder="Calle, numero, edificio..."
                                disabled={procesando}
                            />
                        </div>

                        <div className={estilos.grid}>
                            <div className={estilos.grupoInput}>
                                <label>Sector</label>
                                <input
                                    type="text"
                                    name="sector"
                                    value={formData.sector}
                                    onChange={manejarCambio}
                                    className={estilos.input}
                                    placeholder="Ej: Naco"
                                    disabled={procesando}
                                />
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>Municipio</label>
                                <input
                                    type="text"
                                    name="municipio"
                                    value={formData.municipio}
                                    onChange={manejarCambio}
                                    className={estilos.input}
                                    placeholder="Ej: Santo Domingo"
                                    disabled={procesando}
                                />
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>Provincia</label>
                                <input
                                    type="text"
                                    name="provincia"
                                    value={formData.provincia}
                                    onChange={manejarCambio}
                                    className={estilos.input}
                                    placeholder="Ej: Distrito Nacional"
                                    disabled={procesando}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={`${estilos.panel} ${estilos[tema]}`}>
                        <h2 className={estilos.panelTitulo}>Condiciones Comerciales</h2>
                        
                        <div className={estilos.grupoInput}>
                            <label>Condiciones de Pago</label>
                            <textarea
                                name="condiciones_pago"
                                value={formData.condiciones_pago}
                                onChange={manejarCambio}
                                className={estilos.textarea}
                                placeholder="Ej: Pago a 30 dias, descuento por pronto pago..."
                                rows="4"
                                disabled={procesando}
                            />
                        </div>
                    </div>

                    <div className={estilos.botonesFormulario}>
                        <button
                            type="button"
                            onClick={volverListado}
                            className={estilos.btnCancelar}
                            disabled={procesando}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className={estilos.btnGuardar}
                            disabled={procesando}
                        >
                            {procesando ? 'Guardando...' : modoEdicion ? 'Actualizar Proveedor' : 'Crear Proveedor'}
                        </button>
                    </div>
                </form>
            </div>
        )
    }

    if (vistaActual === 'detalles' && proveedorSeleccionado) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.header}>
                    <div>
                        <h1 className={estilos.titulo}>Detalles del Proveedor</h1>
                        <p className={estilos.subtitulo}>Informacion completa</p>
                    </div>
                    <div className={estilos.headerAcciones}>
                        <button
                            type="button"
                            onClick={() => abrirFormularioEditar(proveedorSeleccionado)}
                            className={estilos.btnEditar}
                            disabled={procesando}
                        >
                            <ion-icon name="create-outline"></ion-icon>
                            <span>Editar</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => manejarEliminar(proveedorSeleccionado.id, proveedorSeleccionado.nombre_comercial)}
                            className={estilos.btnEliminar}
                            disabled={procesando}
                        >
                            <ion-icon name="trash-outline"></ion-icon>
                            <span>Eliminar</span>
                        </button>
                        <button
                            type="button"
                            onClick={volverListado}
                            className={estilos.btnVolver}
                            disabled={procesando}
                        >
                            <ion-icon name="arrow-back-outline"></ion-icon>
                            <span>Volver</span>
                        </button>
                    </div>
                </div>

                <div className={estilos.detallesGrid}>
                    <div className={`${estilos.panel} ${estilos[tema]}`}>
                        <div className={estilos.panelHeader}>
                            <h2 className={estilos.panelTitulo}>Informacion General</h2>
                            <span className={`${estilos.badge} ${proveedorSeleccionado.activo ? estilos.activo : estilos.inactivo}`}>
                                {proveedorSeleccionado.activo ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>

                        <div className={estilos.infoGrid}>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>RNC</span>
                                <span className={estilos.infoValor}>{proveedorSeleccionado.rnc}</span>
                            </div>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>Nombre Comercial</span>
                                <span className={estilos.infoValor}>{proveedorSeleccionado.nombre_comercial}</span>
                            </div>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>Razon Social</span>
                                <span className={estilos.infoValor}>{proveedorSeleccionado.razon_social}</span>
                            </div>
                            {proveedorSeleccionado.actividad_economica && (
                                <div className={estilos.infoItem}>
                                    <span className={estilos.infoLabel}>Actividad Economica</span>
                                    <span className={estilos.infoValor}>{proveedorSeleccionado.actividad_economica}</span>
                                </div>
                            )}
                            {proveedorSeleccionado.contacto && (
                                <div className={estilos.infoItem}>
                                    <span className={estilos.infoLabel}>Contacto</span>
                                    <span className={estilos.infoValor}>{proveedorSeleccionado.contacto}</span>
                                </div>
                            )}
                            {proveedorSeleccionado.telefono && (
                                <div className={estilos.infoItem}>
                                    <span className={estilos.infoLabel}>Telefono</span>
                                    <span className={estilos.infoValor}>{proveedorSeleccionado.telefono}</span>
                                </div>
                            )}
                            {proveedorSeleccionado.email && (
                                <div className={estilos.infoItem}>
                                    <span className={estilos.infoLabel}>Email</span>
                                    <span className={estilos.infoValor}>{proveedorSeleccionado.email}</span>
                                </div>
                            )}
                            {proveedorSeleccionado.sitio_web && (
                                <div className={estilos.infoItem}>
                                    <span className={estilos.infoLabel}>Sitio Web</span>
                                    <span className={estilos.infoValor}>
                                        <a href={proveedorSeleccionado.sitio_web} target="_blank" rel="noopener noreferrer">
                                            {proveedorSeleccionado.sitio_web}
                                        </a>
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {(proveedorSeleccionado.direccion || proveedorSeleccionado.sector || proveedorSeleccionado.municipio || proveedorSeleccionado.provincia) && (
                        <div className={`${estilos.panel} ${estilos[tema]}`}>
                            <h2 className={estilos.panelTitulo}>Ubicacion</h2>
                            <div className={estilos.infoGrid}>
                                {proveedorSeleccionado.direccion && (
                                    <div className={estilos.infoItem}>
                                        <span className={estilos.infoLabel}>Direccion</span>
                                        <span className={estilos.infoValor}>{proveedorSeleccionado.direccion}</span>
                                    </div>
                                )}
                                {proveedorSeleccionado.sector && (
                                    <div className={estilos.infoItem}>
                                        <span className={estilos.infoLabel}>Sector</span>
                                        <span className={estilos.infoValor}>{proveedorSeleccionado.sector}</span>
                                    </div>
                                )}
                                {proveedorSeleccionado.municipio && (
                                    <div className={estilos.infoItem}>
                                        <span className={estilos.infoLabel}>Municipio</span>
                                        <span className={estilos.infoValor}>{proveedorSeleccionado.municipio}</span>
                                    </div>
                                )}
                                {proveedorSeleccionado.provincia && (
                                    <div className={estilos.infoItem}>
                                        <span className={estilos.infoLabel}>Provincia</span>
                                        <span className={estilos.infoValor}>{proveedorSeleccionado.provincia}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className={`${estilos.panel} ${estilos[tema]}`}>
                        <h2 className={estilos.panelTitulo}>Estadisticas de Compras</h2>
                        <div className={estilos.estadisticasCompras}>
                            <div className={estilos.estadCompraCard}>
                                <ion-icon name="bag-handle-outline"></ion-icon>
                                <div>
                                    <span className={estilos.estadCompraLabel}>Total Compras</span>
                                    <span className={estilos.estadCompraValor}>{proveedorSeleccionado.total_compras}</span>
                                </div>
                            </div>
                            <div className={estilos.estadCompraCard}>
                                <ion-icon name="cash-outline"></ion-icon>
                                <div>
                                    <span className={estilos.estadCompraLabel}>Monto Total</span>
                                    <span className={estilos.estadCompraValor}>{formatearMoneda(proveedorSeleccionado.monto_total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {proveedorSeleccionado.condiciones_pago && (
                        <div className={`${estilos.panel} ${estilos[tema]}`}>
                            <h2 className={estilos.panelTitulo}>Condiciones de Pago</h2>
                            <p className={estilos.condicionesPago}>{proveedorSeleccionado.condiciones_pago}</p>
                        </div>
                    )}

                    {proveedorSeleccionado.ultimas_compras && proveedorSeleccionado.ultimas_compras.length > 0 && (
                        <div className={`${estilos.panel} ${estilos[tema]} ${estilos.panelFull}`}>
                            <h2 className={estilos.panelTitulo}>Ultimas Compras</h2>
                            <div className={estilos.tablaCompras}>
                                {proveedorSeleccionado.ultimas_compras.map((compra) => (
                                    <div key={compra.id} className={`${estilos.compraItem} ${estilos[tema]}`}>
                                        <div className={estilos.compraInfo}>
                                            <span className={estilos.compraNcf}>{compra.ncf}</span>
                                            <span className={estilos.compraFecha}>{formatearFecha(compra.fecha_compra)}</span>
                                        </div>
                                        <div className={estilos.compraDetalle}>
                                            <span className={estilos.compraTotal}>{formatearMoneda(compra.total)}</span>
                                            <span className={`${estilos.compraEstado} ${estilos[compra.estado]}`}>
                                                {compra.estado}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Proveedores</h1>
                    <p className={estilos.subtitulo}>Gestiona tus proveedores</p>
                </div>
                <button
                    onClick={abrirFormularioNuevo}
                    className={estilos.btnNuevo}
                >
                    <ion-icon name="add-circle-outline"></ion-icon>
                    <span>Nuevo Proveedor</span>
                </button>
            </div>

            <div className={estilos.estadisticas}>
                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={estilos.estadIcono}>
                        <ion-icon name="business-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Total Proveedores</span>
                        <span className={estilos.estadValor}>{estadisticas.total}</span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.success}`}>
                        <ion-icon name="checkmark-circle-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Activos</span>
                        <span className={estilos.estadValor}>{estadisticas.activos}</span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.danger}`}>
                        <ion-icon name="close-circle-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Inactivos</span>
                        <span className={estilos.estadValor}>{estadisticas.inactivos}</span>
                    </div>
                </div>
            </div>

            <div className={estilos.controles}>
                <div className={estilos.busqueda}>
                    <ion-icon name="search-outline"></ion-icon>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, razon social o RNC..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className={estilos.inputBusqueda}
                    />
                </div>

                <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className={estilos.selectFiltro}
                >
                    <option value="todos">Todos los estados</option>
                    <option value="activos">Activos</option>
                    <option value="inactivos">Inactivos</option>
                </select>
            </div>

            {cargando ? (
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando proveedores...</span>
                </div>
            ) : proveedoresFiltrados.length === 0 ? (
                <div className={`${estilos.vacio} ${estilos[tema]}`}>
                    <ion-icon name="business-outline"></ion-icon>
                    <span>No hay proveedores que coincidan con tu busqueda</span>
                </div>
            ) : (
                <div className={estilos.grid}>
                    {proveedoresFiltrados.map((proveedor) => (
                        <div key={proveedor.id} className={`${estilos.card} ${estilos[tema]}`}>
                            <div className={estilos.cardHeader}>
                                <div className={estilos.cardTitulo}>
                                    <h3>{proveedor.nombre_comercial}</h3>
                                    <span className={`${estilos.badge} ${proveedor.activo ? estilos.activo : estilos.inactivo}`}>
                                        {proveedor.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            </div>

                            <div className={estilos.cardBody}>
                                <div className={estilos.info}>
                                    <ion-icon name="document-text-outline"></ion-icon>
                                    <div>
                                        <span className={estilos.infoLabel}>Razon Social</span>
                                        <span className={estilos.infoValor}>{proveedor.razon_social}</span>
                                    </div>
                                </div>

                                <div className={estilos.info}>
                                    <ion-icon name="card-outline"></ion-icon>
                                    <div>
                                        <span className={estilos.infoLabel}>RNC</span>
                                        <span className={estilos.infoValor}>{proveedor.rnc}</span>
                                    </div>
                                </div>

                                {proveedor.contacto && (
                                    <div className={estilos.info}>
                                        <ion-icon name="person-outline"></ion-icon>
                                        <div>
                                            <span className={estilos.infoLabel}>Contacto</span>
                                            <span className={estilos.infoValor}>{proveedor.contacto}</span>
                                        </div>
                                    </div>
                                )}

                                {proveedor.telefono && (
                                    <div className={estilos.info}>
                                        <ion-icon name="call-outline"></ion-icon>
                                        <div>
                                            <span className={estilos.infoLabel}>Telefono</span>
                                            <span className={estilos.infoValor}>{proveedor.telefono}</span>
                                        </div>
                                    </div>
                                )}

                                {proveedor.email && (
                                    <div className={estilos.info}>
                                        <ion-icon name="mail-outline"></ion-icon>
                                        <div>
                                            <span className={estilos.infoLabel}>Email</span>
                                            <span className={estilos.infoValor}>{proveedor.email}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className={estilos.cardFooter}>
                                <button
                                    onClick={() => abrirDetalles(proveedor.id)}
                                    className={estilos.btnIcono}
                                    title="Ver detalles"
                                >
                                    <ion-icon name="eye-outline"></ion-icon>
                                </button>
                                <button
                                    onClick={() => abrirFormularioEditar(proveedor)}
                                    className={estilos.btnIcono}
                                    title="Editar"
                                >
                                    <ion-icon name="create-outline"></ion-icon>
                                </button>
                                <button
                                    className={`${estilos.btnIcono} ${estilos.eliminar}`}
                                    onClick={() => manejarEliminar(proveedor.id, proveedor.nombre_comercial)}
                                    disabled={procesando}
                                    title="Eliminar"
                                >
                                    <ion-icon name="trash-outline"></ion-icon>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}