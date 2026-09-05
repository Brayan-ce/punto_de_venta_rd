"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { obtenerConfigCatalogo, guardarConfigCatalogo, generarSlugAuto, obtenerDatosEmpresa } from './servidor'
import { obtenerProductosCatalogo, actualizarProductoCatalogo, toggleVisibilidadProducto } from './productos/servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './catalogo.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function CatalogoAdmin() {
    const router = useRouter()
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [guardando, setGuardando] = useState(false)
    const [config, setConfig] = useState(null)
    const [productos, setProductos] = useState([])
    const [tabActiva, setTabActiva] = useState('config')
    const [baseUrl, setBaseUrl] = useState('http://localhost:3000')
    const [copiado, setCopiado] = useState(false)
    const [empresa, setEmpresa] = useState(null)

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
        if (typeof window !== 'undefined') {
            setBaseUrl(window.location.origin)
        }
        cargarDatos()
        cargarEmpresa()
    }, [])

    const cargarEmpresa = async () => {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresa(res.empresa)
    }

    const formatearMoneda = (monto) => {
        const locale = language === 'en' ? 'en-US' : (empresa?.locale || 'es-DO')
        const moneda = empresa?.moneda || 'DOP'
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: moneda,
            minimumFractionDigits: 2
        }).format(monto || 0)
    }

    const cargarDatos = async () => {
        setCargando(true)
        try {
            const [resultadoConfig, resultadoProductos] = await Promise.all([
                obtenerConfigCatalogo(),
                obtenerProductosCatalogo()
            ])

            if (resultadoConfig.success) {
                setConfig(resultadoConfig.config || {
                    nombre_catalogo: '',
                    descripcion: '',
                    url_slug: '',
                    color_primario: '#FF6B35',
                    color_secundario: '#004E89',
                    activo: true,
                    whatsapp: '',
                    direccion: '',
                    horario: '',
                    logo_url: null
                })
            }

            if (resultadoProductos.success) {
                setProductos(resultadoProductos.productos)
            }
        } catch (error) {
            console.error('Error al cargar datos:', error)
            alert(tr('Error al cargar datos', 'Error loading data'))
        } finally {
            setCargando(false)
        }
    }

    const manejarGuardarConfig = async () => {
        if (!config) return

        // Validar que tenga slug o nombre para generar uno
        if (!config.url_slug?.trim() && !config.nombre_catalogo?.trim()) {
            alert(tr('Debes ingresar un nombre de catálogo o un URL slug', 'Please enter a catalog name or URL slug'))
            return
        }

        setGuardando(true)
        try {
            const resultado = await guardarConfigCatalogo(config)
            if (resultado.success) {
                alert(tr('Configuración guardada correctamente', 'Settings saved successfully'))
                await cargarDatos()
            } else {
                alert(resultado.mensaje || tr('Error al guardar configuración', 'Error saving settings'))
            }
        } catch (error) {
            console.error('Error al guardar:', error)
            alert(tr('Error al guardar configuración', 'Error saving settings'))
        } finally {
            setGuardando(false)
        }
    }

    // Función para generar slug localmente
    const generarSlugLocal = (nombre) => {
        if (!nombre) return ''
        return nombre
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
            .replace(/[^a-z0-9]+/g, '-') // Reemplazar caracteres especiales con guión
            .replace(/^-+|-+$/g, '') // Eliminar guiones al inicio y final
    }

    // Manejar cambio de nombre y auto-generar slug si está vacío
    const manejarCambioNombre = (nombre) => {
        const nuevoSlug = !config?.url_slug ? generarSlugLocal(nombre) : config.url_slug
        setConfig({ ...config, nombre_catalogo: nombre, url_slug: nuevoSlug })
    }

    const manejarGenerarSlug = async () => {
        try {
            const resultado = await generarSlugAuto()
            if (resultado.success) {
                setConfig({ ...config, url_slug: resultado.slug })
            }
        } catch (error) {
            console.error('Error al generar slug:', error)
        }
    }

    const manejarToggleVisibilidad = async (productoId, visible) => {
        try {
            const resultado = await toggleVisibilidadProducto(productoId, visible)
            if (resultado.success) {
                await cargarDatos()
            }
        } catch (error) {
            console.error('Error al cambiar visibilidad:', error)
        }
    }

    const manejarToggleDestacado = async (productoId, destacado) => {
        try {
            const resultado = await actualizarProductoCatalogo(productoId, { destacado })
            if (resultado.success) {
                await cargarDatos()
            }
        } catch (error) {
            console.error('Error al cambiar destacado:', error)
        }
    }

    const copiarUrl = () => {
        if (!config?.url_slug) return
        const catalogUrl = `${baseUrl}/catalogo/${config.url_slug}`
        navigator.clipboard.writeText(catalogUrl)
        setCopiado(true)
        setTimeout(() => setCopiado(false), 2000)
    }

    const compartirWhatsApp = () => {
        if (!config?.url_slug) return
        const catalogUrl = `${baseUrl}/catalogo/${config.url_slug}`
        const mensaje = encodeURIComponent(`¡Mira nuestro catálogo online! ${catalogUrl}`)
        const whatsappUrl = `https://wa.me/?text=${mensaje}`
        window.open(whatsappUrl, '_blank')
    }

    const verVistaPrevia = () => {
        if (!config?.url_slug) {
            alert(tr('Primero debes configurar la URL del catálogo', 'You must configure the catalog URL first'))
            return
        }
        window.open(`${baseUrl}/catalogo/${config.url_slug}`, '_blank')
    }

    const productosVisibles = productos.filter(p => p.visible_catalogo || p.visible).length
    const productosDestacados = productos.filter(p => p.destacado).length

    if (cargando) { return <LoadingScreen /> }

    const urlCatalogo = config?.url_slug ? `${baseUrl}/catalogo/${config.url_slug}` : ''

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* Header */}
            <div className={estilos.header}>
                <div className={estilos.headerContenedor}>
                    <div>
                        <h1 className={estilos.titulo}>{tr('Catálogo Online', 'Online Catalog')}</h1>
                        <p className={estilos.subtitulo}>{tr('Configura y gestiona tu tienda online', 'Configure and manage your online store')}</p>
                    </div>
                    <div className={estilos.headerAcciones}>
                        <button
                            onClick={verVistaPrevia}
                            className={estilos.btnVistaPrevia}
                            disabled={!config?.url_slug}
                        >
                            <ion-icon name="eye-outline"></ion-icon>
                            <span>{tr('Vista Previa', 'Preview')}</span>
                        </button>
                        <button
                            onClick={manejarGuardarConfig}
                            disabled={guardando}
                            className={estilos.btnGuardar}
                        >
                            {guardando ? (
                                <>
                                    <ion-icon name="refresh-outline" className={estilos.iconoCargando}></ion-icon>
                                    <span>{tr('Guardando...', 'Saving...')}</span>
                                </>
                            ) : (
                                <>
                                    <ion-icon name="save-outline"></ion-icon>
                                    <span>{tr('Guardar Cambios', 'Save Changes')}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Estadísticas Rápidas */}
            <div className={estilos.estadisticas}>
                <div className={estilos.estadisticaCard} style={{ borderColor: '#fbbf24' }}>
                    <div className={estilos.estadisticaHeader}>
                        <div className={estilos.estadisticaIcono} style={{ backgroundColor: '#fef3c7' }}>
                            <ion-icon name="globe-outline" style={{ color: '#d97706' }}></ion-icon>
                        </div>
                        <div className={`${estilos.estadisticaBadge} ${config?.activo ? estilos.estadisticaBadgeActivo : estilos.estadisticaBadgeInactivo}`}>
                            {config?.activo ? tr('Activo', 'Active') : tr('Inactivo', 'Inactive')}
                        </div>
                    </div>
                    <h3 className={estilos.estadisticaTitulo}>{tr('Estado', 'Status')}</h3>
                    <p className={estilos.estadisticaDescripcion}>
                        {tr('Catálogo', 'Catalog')} {config?.activo ? tr('publicado', 'published') : tr('en borrador', 'draft')}
                    </p>
                </div>

                <div className={estilos.estadisticaCard} style={{ borderColor: '#60a5fa' }}>
                    <div className={estilos.estadisticaHeader}>
                        <div className={estilos.estadisticaIcono} style={{ backgroundColor: '#dbeafe' }}>
                            <ion-icon name="cube-outline" style={{ color: '#3b82f6' }}></ion-icon>
                        </div>
                        <span className={estilos.estadisticaNumero}>{productosVisibles}</span>
                    </div>
                    <h3 className={estilos.estadisticaTitulo}>{tr('Productos', 'Products')}</h3>
                    <p className={estilos.estadisticaDescripcion}>{tr('Visibles en catálogo', 'Visible in catalog')}</p>
                </div>

                <div className={estilos.estadisticaCard} style={{ borderColor: '#a78bfa' }}>
                    <div className={estilos.estadisticaHeader}>
                        <div className={estilos.estadisticaIcono} style={{ backgroundColor: '#ede9fe' }}>
                            <ion-icon name="star-outline" style={{ color: '#8b5cf6' }}></ion-icon>
                        </div>
                        <span className={estilos.estadisticaNumero}>{productosDestacados}</span>
                    </div>
                    <h3 className={estilos.estadisticaTitulo}>{tr('Destacados', 'Featured')}</h3>
                    <p className={estilos.estadisticaDescripcion}>{tr('Productos en portada', 'Products on homepage')}</p>
                </div>

                <div className={estilos.estadisticaCard} style={{ borderColor: '#34d399' }}>
                    <div className={estilos.estadisticaHeader}>
                        <div className={estilos.estadisticaIcono} style={{ backgroundColor: '#d1fae5' }}>
                            <ion-icon name="people-outline" style={{ color: '#10b981' }}></ion-icon>
                        </div>
                        <span className={estilos.estadisticaNumero}>-</span>
                    </div>
                    <h3 className={estilos.estadisticaTitulo}>{tr('Visitas', 'Visits')}</h3>
                    <p className={estilos.estadisticaDescripcion}>{tr('Últimos 7 días', 'Last 7 days')}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className={estilos.tabs}>
                <button
                    className={`${estilos.tab} ${tabActiva === 'config' ? estilos.tabActiva : ''}`}
                    onClick={() => setTabActiva('config')}
                >
                    <ion-icon name="settings-outline"></ion-icon>
                    <span>{tr('Configuración', 'Settings')}</span>
                </button>
                <button
                    className={`${estilos.tab} ${tabActiva === 'productos' ? estilos.tabActiva : ''}`}
                    onClick={() => setTabActiva('productos')}
                >
                    <ion-icon name="cube-outline"></ion-icon>
                    <span>{tr('Productos', 'Products')} ({productosVisibles} {tr('visibles', 'visible')})</span>
                </button>
            </div>

            {/* Contenido Principal */}
            <div className={estilos.contenidoPrincipal}>
                {tabActiva === 'config' && config && (
                    <div className={estilos.contenidoIzquierdo}>
                        {/* Información Básica */}
                        <div className={estilos.seccion}>
                            <div className={estilos.seccionHeader}>
                                <div className={estilos.seccionIcono} style={{ backgroundColor: '#fef3c7' }}>
                                    <ion-icon name="settings-outline" style={{ color: '#d97706' }}></ion-icon>
                                </div>
                                <h2 className={estilos.seccionTitulo}>{tr('Información Básica', 'Basic Information')}</h2>
                            </div>

                            <div className={estilos.formulario}>
                                <div className={estilos.campo}>
                                    <label className={estilos.label}>{tr('Nombre del Catálogo *', 'Catalog Name *')}</label>
                                    <input
                                        type="text"
                                        value={config.nombre_catalogo || ''}
                                        onChange={(e) => manejarCambioNombre(e.target.value)}
                                        placeholder={tr('Ej: Barra 4 Vientos', 'Ex: Four Winds Bar')}
                                        className={estilos.input}
                                    />
                                </div>

                                <div className={estilos.campo}>
                                    <label className={estilos.label}>{tr('Descripción Corta', 'Short Description')}</label>
                                    <textarea
                                        value={config.descripcion || ''}
                                        onChange={(e) => setConfig({ ...config, descripcion: e.target.value })}
                                        rows="3"
                                        placeholder={tr('Descripción corta del catálogo', 'Short catalog description')}
                                        className={estilos.textarea}
                                    />
                                </div>

                                <div className={estilos.campo}>
                                    <label className={estilos.label}>
                                        {tr('URL del Catálogo', 'Catalog URL')}
                                        {!config?.url_slug?.trim() && (
                                            <span style={{ color: '#ef4444', marginLeft: '8px', fontSize: '12px' }}>
                                                ⚠️ {tr('Requerido para publicar', 'Required to publish')}
                                            </span>
                                        )}
                                    </label>
                                    <div className={`${estilos.inputGroup} ${!config?.url_slug?.trim() ? estilos.inputGroupError : ''}`}>
                                        <span className={estilos.prefijo}>{baseUrl}/catalogo/</span>
                                        <input
                                            type="text"
                                            value={config.url_slug || ''}
                                            onChange={(e) => setConfig({ ...config, url_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                            placeholder={tr('barra4vientos', 'fourwindsbar')}
                                            className={`${estilos.inputSlug} ${!config?.url_slug?.trim() ? estilos.inputError : ''}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={manejarGenerarSlug}
                                            className={estilos.btnGenerarSlug}
                                        >
                                            <ion-icon name="sync-outline"></ion-icon>
                                            <span>{tr('Generar', 'Generate')}</span>
                                        </button>
                                    </div>
                                    <p className={estilos.ayudaTexto}>
                                        {tr('Solo letras minúsculas, números y guiones', 'Only lowercase letters, numbers and hyphens')}
                                    </p>
                                    {!config?.url_slug?.trim() && config?.nombre_catalogo?.trim() && (
                                        <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                                            ⚠️ {tr('Haz clic en "Generar" para crear el URL automáticamente', 'Click "Generate" to create the URL automatically')}
                                        </p>
                                    )}
                                </div>

                                <div className={estilos.campoGrid}>
                                    <div className={estilos.campo}>
                                        <label className={estilos.label}>{tr('WhatsApp', 'WhatsApp')}</label>
                                        <input
                                            type="tel"
                                            value={config.whatsapp || ''}
                                            onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })}
                                            placeholder="809-555-1234"
                                            className={estilos.input}
                                        />
                                    </div>
                                    <div className={estilos.campo}>
                                        <label className={estilos.label}>{tr('Horario', 'Schedule')}</label>
                                        <input
                                            type="text"
                                            value={config.horario || ''}
                                            onChange={(e) => setConfig({ ...config, horario: e.target.value })}
                                            placeholder={tr('Lun-Vie: 9AM-6PM', 'Mon-Fri: 9AM-6PM')}
                                            className={estilos.input}
                                        />
                                    </div>
                                </div>

                                <div className={estilos.campo}>
                                    <label className={estilos.label}>{tr('Dirección', 'Address')}</label>
                                    <input
                                        type="text"
                                        value={config.direccion || ''}
                                        onChange={(e) => setConfig({ ...config, direccion: e.target.value })}
                                        placeholder={tr('Calle Principal #123', 'Main Street #123')}
                                        className={estilos.input}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Apariencia */}
                        <div className={estilos.seccion}>
                            <div className={estilos.seccionHeader}>
                                <div className={estilos.seccionIcono} style={{ backgroundColor: '#ede9fe' }}>
                                    <ion-icon name="color-palette-outline" style={{ color: '#8b5cf6' }}></ion-icon>
                                </div>
                                <h2 className={estilos.seccionTitulo}>{tr('Apariencia', 'Appearance')}</h2>
                            </div>

                            <div className={estilos.formulario}>
                                <div className={estilos.campo}>
                                    <label className={estilos.label}>{tr('Logo del Negocio', 'Business Logo')}</label>
                                    <div className={estilos.uploadArea}>
                                        {config.logo_url ? (
                                            <div className={estilos.logoPreview}>
                                                <img src={config.logo_url} alt="Logo" />
                                                <button
                                                    type="button"
                                                    onClick={() => setConfig({ ...config, logo_url: null })}
                                                    className={estilos.btnEliminarLogo}
                                                >
                                                    <ion-icon name="close-outline"></ion-icon>
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <ion-icon name="image-outline" className={estilos.uploadIcon}></ion-icon>
                                                <p className={estilos.uploadTexto}>{tr('Arrastra tu logo aquí o haz clic para subir', 'Drag your logo here or click to upload')}</p>
                                                <p className={estilos.uploadAyuda}>
                                                    PNG, JPG hasta 2MB
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className={estilos.campoGrid}>
                                    <div className={estilos.campo}>
                                        <label className={estilos.label}>{tr('Color Primario', 'Primary Color')}</label>
                                        <div className={estilos.colorInputGroup}>
                                            <input
                                                type="color"
                                                value={config.color_primario || '#FF6B35'}
                                                onChange={(e) => setConfig({ ...config, color_primario: e.target.value })}
                                                className={estilos.colorPicker}
                                            />
                                            <input
                                                type="text"
                                                value={config.color_primario || '#FF6B35'}
                                                onChange={(e) => setConfig({ ...config, color_primario: e.target.value })}
                                                className={estilos.colorInput}
                                            />
                                        </div>
                                    </div>
                                    <div className={estilos.campo}>
                                        <label className={estilos.label}>{tr('Color Secundario', 'Secondary Color')}</label>
                                        <div className={estilos.colorInputGroup}>
                                            <input
                                                type="color"
                                                value={config.color_secundario || '#004E89'}
                                                onChange={(e) => setConfig({ ...config, color_secundario: e.target.value })}
                                                className={estilos.colorPicker}
                                            />
                                            <input
                                                type="text"
                                                value={config.color_secundario || '#004E89'}
                                                onChange={(e) => setConfig({ ...config, color_secundario: e.target.value })}
                                                className={estilos.colorInput}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {tabActiva === 'productos' && (
                    <div className={estilos.contenidoIzquierdo}>
                        {/* Gestión de Productos */}
                        <div className={estilos.seccion}>
                            <div className={estilos.seccionHeader}>
                                <div className={estilos.seccionIcono} style={{ backgroundColor: '#dbeafe' }}>
                                    <ion-icon name="cube-outline" style={{ color: '#3b82f6' }}></ion-icon>
                                </div>
                                <h2 className={estilos.seccionTitulo}>{tr('Productos del Catálogo', 'Catalog Products')}</h2>
                                <div className={estilos.contadorProductos}>
                                    {productosVisibles} {tr('de', 'of')} {productos.length} {tr('visibles', 'visible')}
                                </div>
                            </div>

                            <div className={estilos.listaProductos}>
                                {productos.map((producto) => {
                                    const esVisible = producto.visible_catalogo || producto.visible || false
                                    const esDestacado = producto.destacado || false
                                    return (
                                        <div
                                            key={producto.id}
                                            className={`${estilos.productoCard} ${esVisible ? estilos.productoCardVisible : ''}`}
                                        >
                                            <div className={estilos.productoImagen}>
                                                {producto.imagen_url ? (
                                                    <img src={producto.imagen_url} alt={producto.nombre} />
                                                ) : (
                                                    <ion-icon name="cube-outline"></ion-icon>
                                                )}
                                            </div>
                                            <div className={estilos.productoInfo}>
                                                <div className={estilos.productoHeader}>
                                                    <h3 className={estilos.productoNombre}>{producto.nombre}</h3>
                                                    {esDestacado && (
                                                        <span className={estilos.badgeDestacado}>
                                                            ⭐ {tr('Destacado', 'Featured')}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className={estilos.productoDetalles}>
                                                    <span className={estilos.productoPrecio}>
                                                        {formatearMoneda(parseFloat(producto.precio_venta || 0))}
                                                    </span>
                                                    {producto.precio_oferta && (
                                                        <span className={estilos.productoOferta}>
                                                            {tr('Oferta', 'Offer')}: {formatearMoneda(parseFloat(producto.precio_oferta))}
                                                        </span>
                                                    )}
                                                    <span className={estilos.productoStock}>
                                                        {tr('Stock', 'Stock')}: {producto.stock || 0}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={estilos.productoAcciones}>
                                                <button
                                                    onClick={() => manejarToggleDestacado(producto.id, !esDestacado)}
                                                    className={`${estilos.btnDestacado} ${esDestacado ? estilos.btnDestacadoActivo : ''}`}
                                                    title={tr('Destacar producto', 'Feature product')}
                                                >
                                                    <ion-icon name="star-outline"></ion-icon>
                                                </button>
                                                <button
                                                    onClick={() => manejarToggleVisibilidad(producto.id, !esVisible)}
                                                    className={`${estilos.btnToggle} ${esVisible ? estilos.btnToggleActivo : ''}`}
                                                >
                                                    {esVisible ? (
                                                        <>
                                                            <ion-icon name="eye-outline"></ion-icon>
                                                            <span>{tr('Visible', 'Visible')}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ion-icon name="eye-off-outline"></ion-icon>
                                                            <span>{tr('Oculto', 'Hidden')}</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Sidebar */}
                <div className={estilos.sidebar}>
                    {/* Estado de Publicación */}
                    <div className={estilos.sidebarCard}>
                        <h3 className={estilos.sidebarTitulo}>{tr('Publicación', 'Publication')}</h3>
                        <div className={estilos.publicacionContenido}>
                            <div className={estilos.publicacionToggle}>
                                <span className={estilos.publicacionLabel}>{tr('Estado del Catálogo', 'Catalog Status')}</span>
                                <button
                                    onClick={() => setConfig({ ...config, activo: !config.activo })}
                                    className={`${estilos.toggle} ${config?.activo ? estilos.toggleActivo : ''}`}
                                >
                                    <span className={estilos.toggleSlider}></span>
                                </button>
                            </div>
                            <p className={estilos.publicacionDescripcion}>
                                {config?.activo
                                    ? tr('Tu catálogo está visible públicamente', 'Your catalog is publicly visible')
                                    : tr('Tu catálogo está oculto del público', 'Your catalog is hidden from the public')}
                            </p>
                        </div>
                    </div>

                    {/* Compartir */}
                    {config?.url_slug && (
                        <div className={estilos.sidebarCardCompartir}>
                            <div className={estilos.compartirHeader}>
                                <ion-icon name="link-outline"></ion-icon>
                                <h3 className={estilos.compartirTitulo}>{tr('Compartir Catálogo', 'Share Catalog')}</h3>
                            </div>
                            
                            <div className={estilos.urlContainer}>
                                <div className={estilos.urlTexto}>
                                    <span className={estilos.urlTruncate}>{urlCatalogo}</span>
                                </div>
                                <button
                                    onClick={copiarUrl}
                                    className={estilos.btnCopiarUrl}
                                >
                                    {copiado ? (
                                        <ion-icon name="checkmark-outline"></ion-icon>
                                    ) : (
                                        <ion-icon name="copy-outline"></ion-icon>
                                    )}
                                </button>
                            </div>

                            <div className={estilos.compartirAcciones}>
                                <button
                                    onClick={() => {
                                        // Generar QR code - implementar después
                                        alert(tr('Generación de QR próximamente', 'QR generation coming soon'))
                                    }}
                                    className={estilos.btnQR}
                                >
                                    <ion-icon name="qr-code-outline"></ion-icon>
                                    <span>{tr('Generar Código QR', 'Generate QR Code')}</span>
                                </button>
                                <button
                                    onClick={compartirWhatsApp}
                                    className={estilos.btnWhatsApp}
                                >
                                    📱 {tr('Compartir por WhatsApp', 'Share via WhatsApp')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Ayuda */}
                    <div className={estilos.sidebarCardAyuda}>
                        <h3 className={estilos.ayudaTitulo}>💡 {tr('Consejo', 'Tip')}</h3>
                        <p className={estilos.ayudaTexto}>
                            {tr('Activa productos destacados para mostrarlos en la portada. Los productos con ofertas atraen más atención de los clientes.', 'Enable featured products to show them on the homepage. Products with offers attract more customer attention.')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
