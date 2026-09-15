"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerProveedores, obtenerProveedor, crearProveedor, actualizarProveedor, eliminarProveedor, obtenerDatosEmpresa } from './servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './proveedores.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function ProveedoresAdmin() {
    const router = useRouter()
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [proveedores, setProveedores] = useState([])
    const [empresa, setEmpresa] = useState(null)
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
        cargarEmpresa()
    }, [])

    async function cargarEmpresa() {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresa(res.empresa)
    }

    const cargarProveedores = async () => {
        setCargando(true)
        try {
            const resultado = await obtenerProveedores()
            if (resultado.success) {
                setProveedores(resultado.proveedores)
            } else {
                alert(resultado.mensaje || tr('Error al cargar proveedores', 'Error loading suppliers'))
            }
        } catch (error) {
            console.error('Error al cargar proveedores:', error)
            alert(tr('Error al cargar datos', 'Error loading data'))
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
                alert(resultado.mensaje || tr('Error al cargar proveedor', 'Error loading supplier'))
            }
        } catch (error) {
            console.error('Error al cargar proveedor:', error)
            alert(tr('Error al cargar datos', 'Error loading data'))
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
            alert(tr('El RNC es obligatorio', 'RNC is required'))
            return false
        }

        if (formData.rnc.length < 9) {
            alert(tr('El RNC debe tener al menos 9 caracteres', 'RNC must have at least 9 characters'))
            return false
        }

        if (!formData.razon_social.trim()) {
            alert(tr('La razon social es obligatoria', 'Business name is required'))
            return false
        }

        if (!formData.nombre_comercial.trim()) {
            alert(tr('El nombre comercial es obligatorio', 'Trade name is required'))
            return false
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            alert(tr('El email no es valido', 'Email is not valid'))
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
                alert(resultado.mensaje || tr('Error al guardar proveedor', 'Error saving supplier'))
            }
        } catch (error) {
            console.error('Error al guardar proveedor:', error)
            alert(tr('Error al procesar la solicitud', 'Error processing request'))
        } finally {
            setProcesando(false)
        }
    }

    const manejarEliminar = async (id, nombre) => {
        if (!confirm(tr(`¿Estas seguro de eliminar el proveedor "${nombre}"?`, `Are you sure you want to delete supplier "${nombre}"?`))) {
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
                alert(resultado.mensaje || tr('Error al eliminar proveedor', 'Error deleting supplier'))
            }
        } catch (error) {
            console.error('Error al eliminar proveedor:', error)
            alert(tr('Error al procesar la solicitud', 'Error processing request'))
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

    const simboloMoneda = empresa?.simbolo_moneda || 'RD$'
    const localeEmpresa = empresa?.locale || 'es-DO'
    const formatearMoneda = (monto) => {
        try {
            const numero = new Intl.NumberFormat(localeEmpresa, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(monto || 0)
            return `${simboloMoneda} ${numero}`
        } catch {
            return `${simboloMoneda} ${Number(monto || 0).toFixed(2)}`
        }
    }

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO', {
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
                        <h1 className={estilos.titulo}>{modoEdicion ? tr('Editar Proveedor', 'Edit Supplier') : tr('Nuevo Proveedor', 'New Supplier')}</h1>
                        <p className={estilos.subtitulo}>{modoEdicion ? tr('Modifica los datos del proveedor', 'Modify supplier data') : tr('Registra un nuevo proveedor', 'Register a new supplier')}</p>
                    </div>
                    <button
                        type="button"
                        onClick={volverListado}
                        className={estilos.btnVolver}
                        disabled={procesando}
                    >
                        <ion-icon name="arrow-back-outline"></ion-icon>
                        <span>{tr('Volver', 'Back')}</span>
                    </button>
                </div>

                <form onSubmit={manejarSubmit} className={estilos.formulario}>
                    <div className={`${estilos.panel} ${estilos[tema]}`}>
                        <h2 className={estilos.panelTitulo}>{tr('Informacion Basica', 'Basic Information')}</h2>
                        
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
                                <label>{tr('Nombre Comercial *', 'Trade Name *')}</label>
                                <input
                                    type="text"
                                    name="nombre_comercial"
                                    value={formData.nombre_comercial}
                                    onChange={manejarCambio}
                                    className={estilos.input}
                                    placeholder={tr('Ej: Distribuidora XYZ', 'Ex: XYZ Distributor')}
                                    required
                                    disabled={procesando}
                                />
                            </div>
                        </div>

                        <div className={estilos.grupoInput}>
                            <label>{tr('Razon Social *', 'Business Name *')}</label>
                            <input
                                type="text"
                                name="razon_social"
                                value={formData.razon_social}
                                onChange={manejarCambio}
                                className={estilos.input}
                                placeholder={tr('Ej: Distribuidora XYZ SRL', 'Ex: XYZ Distributor LLC')}
                                required
                                disabled={procesando}
                            />
                        </div>

                        <div className={estilos.grupoInput}>
                            <label>{tr('Actividad Economica', 'Economic Activity')}</label>
                            <input
                                type="text"
                                name="actividad_economica"
                                value={formData.actividad_economica}
                                onChange={manejarCambio}
                                className={estilos.input}
                                placeholder={tr('Ej: Distribucion de alimentos', 'Ex: Food distribution')}
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
                            <label htmlFor="activo">{tr('Proveedor activo', 'Active supplier')}</label>
                        </div>
                    </div>

                    <div className={`${estilos.panel} ${estilos[tema]}`}>
                        <h2 className={estilos.panelTitulo}>{tr('Informacion de Contacto', 'Contact Information')}</h2>
                        
                        <div className={estilos.grid}>
                            <div className={estilos.grupoInput}>
                                <label>{tr('Persona de Contacto', 'Contact Person')}</label>
                                <input
                                    type="text"
                                    name="contacto"
                                    value={formData.contacto}
                                    onChange={manejarCambio}
                                    className={estilos.input}
                                    placeholder={tr('Ej: Juan Perez', 'Ex: John Doe')}
                                    disabled={procesando}
                                />
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>{tr('Telefono', 'Phone')}</label>
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
                                <label>{tr('Email', 'Email')}</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={manejarCambio}
                                    className={estilos.input}
                                    placeholder={tr('contacto@ejemplo.com', 'contact@example.com')}
                                    disabled={procesando}
                                />
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>{tr('Sitio Web', 'Website')}</label>
                                <input
                                    type="url"
                                    name="sitio_web"
                                    value={formData.sitio_web}
                                    onChange={manejarCambio}
                                    className={estilos.input}
                                    placeholder={tr('https://ejemplo.com', 'https://example.com')}
                                    disabled={procesando}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={`${estilos.panel} ${estilos[tema]}`}>
                        <h2 className={estilos.panelTitulo}>{tr('Ubicacion', 'Location')}</h2>
                        
                        <div className={estilos.grupoInput}>
                            <label>{tr('Direccion', 'Address')}</label>
                            <input
                                type="text"
                                name="direccion"
                                value={formData.direccion}
                                onChange={manejarCambio}
                                className={estilos.input}
                                placeholder={tr('Calle, numero, edificio...', 'Street, number, building...')}
                                disabled={procesando}
                            />
                        </div>

                        <div className={estilos.grid}>
                            <div className={estilos.grupoInput}>
                                <label>{tr('Sector', 'Sector')}</label>
                                <input
                                    type="text"
                                    name="sector"
                                    value={formData.sector}
                                    onChange={manejarCambio}
                                    className={estilos.input}
                                    placeholder={tr('Ej: Naco', 'Ex: Downtown')}
                                    disabled={procesando}
                                />
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>{tr('Municipio', 'Municipality')}</label>
                                <input
                                    type="text"
                                    name="municipio"
                                    value={formData.municipio}
                                    onChange={manejarCambio}
                                    className={estilos.input}
                                    placeholder={tr('Ej: Santo Domingo', 'Ex: Santo Domingo')}
                                    disabled={procesando}
                                />
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>{tr('Provincia', 'Province')}</label>
                                <input
                                    type="text"
                                    name="provincia"
                                    value={formData.provincia}
                                    onChange={manejarCambio}
                                    className={estilos.input}
                                    placeholder={tr('Ej: Distrito Nacional', 'Ex: National District')}
                                    disabled={procesando}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={`${estilos.panel} ${estilos[tema]}`}>
                        <h2 className={estilos.panelTitulo}>{tr('Condiciones Comerciales', 'Commercial Terms')}</h2>
                        
                        <div className={estilos.grupoInput}>
                            <label>{tr('Condiciones de Pago', 'Payment Terms')}</label>
                            <textarea
                                name="condiciones_pago"
                                value={formData.condiciones_pago}
                                onChange={manejarCambio}
                                className={estilos.textarea}
                                placeholder={tr('Ej: Pago a 30 dias, descuento por pronto pago...', 'Ex: Net 30, early payment discount...')}
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
                            {tr('Cancelar', 'Cancel')}
                        </button>
                        <button
                            type="submit"
                            className={estilos.btnGuardar}
                            disabled={procesando}
                        >
                            {procesando ? tr('Guardando...', 'Saving...') : modoEdicion ? tr('Actualizar Proveedor', 'Update Supplier') : tr('Crear Proveedor', 'Create Supplier')}
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
                        <h1 className={estilos.titulo}>{tr('Detalles del Proveedor', 'Supplier Details')}</h1>
                        <p className={estilos.subtitulo}>{tr('Informacion completa', 'Complete information')}</p>
                    </div>
                    <div className={estilos.headerAcciones}>
                        <button
                            type="button"
                            onClick={() => abrirFormularioEditar(proveedorSeleccionado)}
                            className={estilos.btnEditar}
                            disabled={procesando}
                        >
                            <ion-icon name="create-outline"></ion-icon>
                            <span>{tr('Editar', 'Edit')}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => manejarEliminar(proveedorSeleccionado.id, proveedorSeleccionado.nombre_comercial)}
                            className={estilos.btnEliminar}
                            disabled={procesando}
                        >
                            <ion-icon name="trash-outline"></ion-icon>
                            <span>{tr('Eliminar', 'Delete')}</span>
                        </button>
                        <button
                            type="button"
                            onClick={volverListado}
                            className={estilos.btnVolver}
                            disabled={procesando}
                        >
                            <ion-icon name="arrow-back-outline"></ion-icon>
                            <span>{tr('Volver', 'Back')}</span>
                        </button>
                    </div>
                </div>

                <div className={estilos.detallesGrid}>
                    <div className={`${estilos.panel} ${estilos[tema]}`}>
                        <div className={estilos.panelHeader}>
                            <h2 className={estilos.panelTitulo}>{tr('Informacion General', 'General Information')}</h2>
                            <span className={`${estilos.badge} ${proveedorSeleccionado.activo ? estilos.activo : estilos.inactivo}`}>
                                {proveedorSeleccionado.activo ? tr('Activo', 'Active') : tr('Inactivo', 'Inactive')}
                            </span>
                        </div>

                        <div className={estilos.infoGrid}>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>RNC</span>
                                <span className={estilos.infoValor}>{proveedorSeleccionado.rnc}</span>
                            </div>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>{tr('Nombre Comercial', 'Trade Name')}</span>
                                <span className={estilos.infoValor}>{proveedorSeleccionado.nombre_comercial}</span>
                            </div>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>{tr('Razon Social', 'Business Name')}</span>
                                <span className={estilos.infoValor}>{proveedorSeleccionado.razon_social}</span>
                            </div>
                            {proveedorSeleccionado.actividad_economica && (
                                <div className={estilos.infoItem}>
                                    <span className={estilos.infoLabel}>{tr('Actividad Economica', 'Economic Activity')}</span>
                                    <span className={estilos.infoValor}>{proveedorSeleccionado.actividad_economica}</span>
                                </div>
                            )}
                            {proveedorSeleccionado.contacto && (
                                <div className={estilos.infoItem}>
                                    <span className={estilos.infoLabel}>{tr('Contacto', 'Contact')}</span>
                                    <span className={estilos.infoValor}>{proveedorSeleccionado.contacto}</span>
                                </div>
                            )}
                            {proveedorSeleccionado.telefono && (
                                <div className={estilos.infoItem}>
                                    <span className={estilos.infoLabel}>{tr('Telefono', 'Phone')}</span>
                                    <span className={estilos.infoValor}>{proveedorSeleccionado.telefono}</span>
                                </div>
                            )}
                            {proveedorSeleccionado.email && (
                                <div className={estilos.infoItem}>
                                    <span className={estilos.infoLabel}>{tr('Email', 'Email')}</span>
                                    <span className={estilos.infoValor}>{proveedorSeleccionado.email}</span>
                                </div>
                            )}
                            {proveedorSeleccionado.sitio_web && (
                                <div className={estilos.infoItem}>
                                    <span className={estilos.infoLabel}>{tr('Sitio Web', 'Website')}</span>
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
                            <h2 className={estilos.panelTitulo}>{tr('Ubicacion', 'Location')}</h2>
                            <div className={estilos.infoGrid}>
                                {proveedorSeleccionado.direccion && (
                                    <div className={estilos.infoItem}>
                                        <span className={estilos.infoLabel}>{tr('Direccion', 'Address')}</span>
                                        <span className={estilos.infoValor}>{proveedorSeleccionado.direccion}</span>
                                    </div>
                                )}
                                {proveedorSeleccionado.sector && (
                                    <div className={estilos.infoItem}>
                                        <span className={estilos.infoLabel}>{tr('Sector', 'Sector')}</span>
                                        <span className={estilos.infoValor}>{proveedorSeleccionado.sector}</span>
                                    </div>
                                )}
                                {proveedorSeleccionado.municipio && (
                                    <div className={estilos.infoItem}>
                                        <span className={estilos.infoLabel}>{tr('Municipio', 'Municipality')}</span>
                                        <span className={estilos.infoValor}>{proveedorSeleccionado.municipio}</span>
                                    </div>
                                )}
                                {proveedorSeleccionado.provincia && (
                                    <div className={estilos.infoItem}>
                                        <span className={estilos.infoLabel}>{tr('Provincia', 'Province')}</span>
                                        <span className={estilos.infoValor}>{proveedorSeleccionado.provincia}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className={`${estilos.panel} ${estilos[tema]}`}>
                        <h2 className={estilos.panelTitulo}>{tr('Estadisticas de Compras', 'Purchase Statistics')}</h2>
                        <div className={estilos.estadisticasCompras}>
                            <div className={estilos.estadCompraCard}>
                                <ion-icon name="bag-handle-outline"></ion-icon>
                                <div>
                                    <span className={estilos.estadCompraLabel}>{tr('Total Compras', 'Total Purchases')}</span>
                                    <span className={estilos.estadCompraValor}>{proveedorSeleccionado.total_compras}</span>
                                </div>
                            </div>
                            <div className={estilos.estadCompraCard}>
                                <ion-icon name="cash-outline"></ion-icon>
                                <div>
                                    <span className={estilos.estadCompraLabel}>{tr('Monto Total', 'Total Amount')}</span>
                                    <span className={estilos.estadCompraValor}>{formatearMoneda(proveedorSeleccionado.monto_total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {proveedorSeleccionado.condiciones_pago && (
                        <div className={`${estilos.panel} ${estilos[tema]}`}>
                            <h2 className={estilos.panelTitulo}>{tr('Condiciones de Pago', 'Payment Terms')}</h2>
                            <p className={estilos.condicionesPago}>{proveedorSeleccionado.condiciones_pago}</p>
                        </div>
                    )}

                    {proveedorSeleccionado.ultimas_compras && proveedorSeleccionado.ultimas_compras.length > 0 && (
                        <div className={`${estilos.panel} ${estilos[tema]} ${estilos.panelFull}`}>
                            <h2 className={estilos.panelTitulo}>{tr('Ultimas Compras', 'Latest Purchases')}</h2>
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
                                                {compra.estado === 'recibida' ? tr('Recibida', 'Received') : compra.estado === 'anulada' ? tr('Anulada', 'Canceled') : compra.estado === 'pendiente' ? tr('Pendiente', 'Pending') : compra.estado}
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
                    <h1 className={estilos.titulo}>{tr('Proveedores', 'Suppliers')}</h1>
                    <p className={estilos.subtitulo}>{tr('Gestiona tus proveedores', 'Manage your suppliers')}</p>
                </div>
                <button
                    onClick={abrirFormularioNuevo}
                    className={estilos.btnNuevo}
                >
                    <ion-icon name="add-circle-outline"></ion-icon>
                    <span>{tr('Nuevo Proveedor', 'New Supplier')}</span>
                </button>
            </div>

            <div className={estilos.estadisticas}>
                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={estilos.estadIcono}>
                        <ion-icon name="business-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>{tr('Total Proveedores', 'Total Suppliers')}</span>
                        <span className={estilos.estadValor}>{estadisticas.total}</span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.success}`}>
                        <ion-icon name="checkmark-circle-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>{tr('Activos', 'Active')}</span>
                        <span className={estilos.estadValor}>{estadisticas.activos}</span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.danger}`}>
                        <ion-icon name="close-circle-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>{tr('Inactivos', 'Inactive')}</span>
                        <span className={estilos.estadValor}>{estadisticas.inactivos}</span>
                    </div>
                </div>
            </div>

            <div className={estilos.controles}>
                <div className={estilos.busqueda}>
                    <ion-icon name="search-outline"></ion-icon>
                    <input
                        type="text"
                        placeholder={tr('Buscar por nombre, razon social o RNC...', 'Search by name, business name or RNC...')}
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
                    <option value="todos">{tr('Todos los estados', 'All statuses')}</option>
                    <option value="activos">{tr('Activos', 'Active')}</option>
                    <option value="inactivos">{tr('Inactivos', 'Inactive')}</option>
                </select>
            </div>

            {cargando ? (
                <LoadingScreen />
            ) : proveedoresFiltrados.length === 0 ? (
                <div className={`${estilos.vacio} ${estilos[tema]}`}>
                    <ion-icon name="business-outline"></ion-icon>
                    <span>{tr('No hay proveedores que coincidan con tu busqueda', 'No suppliers match your search')}</span>
                </div>
            ) : (
                <div className={estilos.grid}>
                    {proveedoresFiltrados.map((proveedor) => (
                        <div key={proveedor.id} className={`${estilos.card} ${estilos[tema]}`}>
                            <div className={estilos.cardHeader}>
                                <div className={estilos.cardTitulo}>
                                    <h3>{proveedor.nombre_comercial}</h3>
                                    <span className={`${estilos.badge} ${proveedor.activo ? estilos.activo : estilos.inactivo}`}>
                                        {proveedor.activo ? tr('Activo', 'Active') : tr('Inactivo', 'Inactive')}
                                    </span>
                                </div>
                            </div>

                            <div className={estilos.cardBody}>
                                <div className={estilos.info}>
                                    <ion-icon name="document-text-outline"></ion-icon>
                                    <div>
                                        <span className={estilos.infoLabel}>{tr('Razon Social', 'Business Name')}</span>
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
                                            <span className={estilos.infoLabel}>{tr('Contacto', 'Contact')}</span>
                                            <span className={estilos.infoValor}>{proveedor.contacto}</span>
                                        </div>
                                    </div>
                                )}

                                {proveedor.telefono && (
                                    <div className={estilos.info}>
                                        <ion-icon name="call-outline"></ion-icon>
                                        <div>
                                            <span className={estilos.infoLabel}>{tr('Telefono', 'Phone')}</span>
                                            <span className={estilos.infoValor}>{proveedor.telefono}</span>
                                        </div>
                                    </div>
                                )}

                                {proveedor.email && (
                                    <div className={estilos.info}>
                                        <ion-icon name="mail-outline"></ion-icon>
                                        <div>
                                            <span className={estilos.infoLabel}>{tr('Email', 'Email')}</span>
                                            <span className={estilos.infoValor}>{proveedor.email}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className={estilos.cardFooter}>
                                <button
                                    onClick={() => abrirDetalles(proveedor.id)}
                                    className={estilos.btnIcono}
                                    title={tr('Ver detalles', 'View details')}
                                >
                                    <ion-icon name="eye-outline"></ion-icon>
                                </button>
                                <button
                                    onClick={() => abrirFormularioEditar(proveedor)}
                                    className={estilos.btnIcono}
                                    title={tr('Editar', 'Edit')}
                                >
                                    <ion-icon name="create-outline"></ion-icon>
                                </button>
                                <button
                                    className={`${estilos.btnIcono} ${estilos.eliminar}`}
                                    onClick={() => manejarEliminar(proveedor.id, proveedor.nombre_comercial)}
                                    disabled={procesando}
                                    title={tr('Eliminar', 'Delete')}
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