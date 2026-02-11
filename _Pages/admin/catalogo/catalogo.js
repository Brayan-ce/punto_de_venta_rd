"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { obtenerConfigCatalogo, guardarConfigCatalogo, generarSlugAuto } from './servidor'
import { obtenerProductosCatalogo, actualizarProductoCatalogo, toggleVisibilidadProducto } from './productos/servidor'
import estilos from './catalogo.module.css'

export default function CatalogoAdmin() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [guardando, setGuardando] = useState(false)
    const [config, setConfig] = useState(null)
    const [productos, setProductos] = useState([])
    const [tabActiva, setTabActiva] = useState('config')
    const [baseUrl, setBaseUrl] = useState('http://localhost:3000')
    const [copiado, setCopiado] = useState(false)

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
    }, [])

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
            alert('Error al cargar datos')
        } finally {
            setCargando(false)
        }
    }

    const manejarGuardarConfig = async () => {
        if (!config) return

        setGuardando(true)
        try {
            const resultado = await guardarConfigCatalogo(config)
            if (resultado.success) {
                alert('Configuración guardada correctamente')
                await cargarDatos()
            } else {
                alert(resultado.mensaje || 'Error al guardar configuración')
            }
        } catch (error) {
            console.error('Error al guardar:', error)
            alert('Error al guardar configuración')
        } finally {
            setGuardando(false)
        }
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
            alert('Primero debes configurar la URL del catálogo')
            return
        }
        window.open(`${baseUrl}/catalogo/${config.url_slug}`, '_blank')
    }

    const productosVisibles = productos.filter(p => p.visible_catalogo || p.visible).length
    const productosDestacados = productos.filter(p => p.destacado).length

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="refresh-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando...</span>
                </div>
            </div>
        )
    }

    const urlCatalogo = config?.url_slug ? `${baseUrl}/catalogo/${config.url_slug}` : ''

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* Header */}
            <div className={estilos.header}>
                <div className={estilos.headerContenedor}>
                    <div>
                        <h1 className={estilos.titulo}>Catálogo Online</h1>
                        <p className={estilos.subtitulo}>Configura y gestiona tu tienda online</p>
                    </div>
                    <div className={estilos.headerAcciones}>
                        <button
                            onClick={verVistaPrevia}
                            className={estilos.btnVistaPrevia}
                            disabled={!config?.url_slug}
                        >
                            <ion-icon name="eye-outline"></ion-icon>
                            <span>Vista Previa</span>
                        </button>
                        <button
                            onClick={manejarGuardarConfig}
                            disabled={guardando}
                            className={estilos.btnGuardar}
                        >
                            {guardando ? (
                                <>
                                    <ion-icon name="refresh-outline" className={estilos.iconoCargando}></ion-icon>
                                    <span>Guardando...</span>
                                </>
                            ) : (
                                <>
                                    <ion-icon name="save-outline"></ion-icon>
                                    <span>Guardar Cambios</span>
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
                            {config?.activo ? 'Activo' : 'Inactivo'}
                        </div>
                    </div>
                    <h3 className={estilos.estadisticaTitulo}>Estado</h3>
                    <p className={estilos.estadisticaDescripcion}>
                        Catálogo {config?.activo ? 'publicado' : 'en borrador'}
                    </p>
                </div>

                <div className={estilos.estadisticaCard} style={{ borderColor: '#60a5fa' }}>
                    <div className={estilos.estadisticaHeader}>
                        <div className={estilos.estadisticaIcono} style={{ backgroundColor: '#dbeafe' }}>
                            <ion-icon name="cube-outline" style={{ color: '#3b82f6' }}></ion-icon>
                        </div>
                        <span className={estilos.estadisticaNumero}>{productosVisibles}</span>
                    </div>
                    <h3 className={estilos.estadisticaTitulo}>Productos</h3>
                    <p className={estilos.estadisticaDescripcion}>Visibles en catálogo</p>
                </div>

                <div className={estilos.estadisticaCard} style={{ borderColor: '#a78bfa' }}>
                    <div className={estilos.estadisticaHeader}>
                        <div className={estilos.estadisticaIcono} style={{ backgroundColor: '#ede9fe' }}>
                            <ion-icon name="star-outline" style={{ color: '#8b5cf6' }}></ion-icon>
                        </div>
                        <span className={estilos.estadisticaNumero}>{productosDestacados}</span>
                    </div>
                    <h3 className={estilos.estadisticaTitulo}>Destacados</h3>
                    <p className={estilos.estadisticaDescripcion}>Productos en portada</p>
                </div>

                <div className={estilos.estadisticaCard} style={{ borderColor: '#34d399' }}>
                    <div className={estilos.estadisticaHeader}>
                        <div className={estilos.estadisticaIcono} style={{ backgroundColor: '#d1fae5' }}>
                            <ion-icon name="people-outline" style={{ color: '#10b981' }}></ion-icon>
                        </div>
                        <span className={estilos.estadisticaNumero}>-</span>
                    </div>
                    <h3 className={estilos.estadisticaTitulo}>Visitas</h3>
                    <p className={estilos.estadisticaDescripcion}>Últimos 7 días</p>
                </div>
            </div>

            {/* Tabs */}
            <div className={estilos.tabs}>
                <button
                    className={`${estilos.tab} ${tabActiva === 'config' ? estilos.tabActiva : ''}`}
                    onClick={() => setTabActiva('config')}
                >
                    <ion-icon name="settings-outline"></ion-icon>
                    <span>Configuración</span>
                </button>
                <button
                    className={`${estilos.tab} ${tabActiva === 'productos' ? estilos.tabActiva : ''}`}
                    onClick={() => setTabActiva('productos')}
                >
                    <ion-icon name="cube-outline"></ion-icon>
                    <span>Productos ({productosVisibles} visibles)</span>
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
                                <h2 className={estilos.seccionTitulo}>Información Básica</h2>
                            </div>

                            <div className={estilos.formulario}>
                                <div className={estilos.campo}>
                                    <label className={estilos.label}>Nombre del Catálogo *</label>
                                    <input
                                        type="text"
                                        value={config.nombre_catalogo || ''}
                                        onChange={(e) => setConfig({ ...config, nombre_catalogo: e.target.value })}
                                        placeholder="Ej: Barra 4 Vientos"
                                        className={estilos.input}
                                    />
                                </div>

                                <div className={estilos.campo}>
                                    <label className={estilos.label}>Descripción Corta</label>
                                    <textarea
                                        value={config.descripcion || ''}
                                        onChange={(e) => setConfig({ ...config, descripcion: e.target.value })}
                                        rows="3"
                                        placeholder="Descripción corta del catálogo"
                                        className={estilos.textarea}
                                    />
                                </div>

                                <div className={estilos.campo}>
                                    <label className={estilos.label}>URL del Catálogo</label>
                                    <div className={estilos.inputGroup}>
                                        <span className={estilos.prefijo}>{baseUrl}/catalogo/</span>
                                        <input
                                            type="text"
                                            value={config.url_slug || ''}
                                            onChange={(e) => setConfig({ ...config, url_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                            placeholder="barra4vientos"
                                            className={estilos.inputSlug}
                                        />
                                        <button
                                            type="button"
                                            onClick={manejarGenerarSlug}
                                            className={estilos.btnGenerarSlug}
                                        >
                                            <ion-icon name="sync-outline"></ion-icon>
                                            <span>Generar</span>
                                        </button>
                                    </div>
                                    <p className={estilos.ayudaTexto}>
                                        Solo letras minúsculas, números y guiones
                                    </p>
                                </div>

                                <div className={estilos.campoGrid}>
                                    <div className={estilos.campo}>
                                        <label className={estilos.label}>WhatsApp</label>
                                        <input
                                            type="tel"
                                            value={config.whatsapp || ''}
                                            onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })}
                                            placeholder="809-555-1234"
                                            className={estilos.input}
                                        />
                                    </div>
                                    <div className={estilos.campo}>
                                        <label className={estilos.label}>Horario</label>
                                        <input
                                            type="text"
                                            value={config.horario || ''}
                                            onChange={(e) => setConfig({ ...config, horario: e.target.value })}
                                            placeholder="Lun-Vie: 9AM-6PM"
                                            className={estilos.input}
                                        />
                                    </div>
                                </div>

                                <div className={estilos.campo}>
                                    <label className={estilos.label}>Dirección</label>
                                    <input
                                        type="text"
                                        value={config.direccion || ''}
                                        onChange={(e) => setConfig({ ...config, direccion: e.target.value })}
                                        placeholder="Calle Principal #123"
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
                                <h2 className={estilos.seccionTitulo}>Apariencia</h2>
                            </div>

                            <div className={estilos.formulario}>
                                <div className={estilos.campo}>
                                    <label className={estilos.label}>Logo del Negocio</label>
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
                                                <p className={estilos.uploadTexto}>
                                                    Arrastra tu logo aquí o haz clic para subir
                                                </p>
                                                <p className={estilos.uploadAyuda}>
                                                    PNG, JPG hasta 2MB
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className={estilos.campoGrid}>
                                    <div className={estilos.campo}>
                                        <label className={estilos.label}>Color Primario</label>
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
                                        <label className={estilos.label}>Color Secundario</label>
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
                                <h2 className={estilos.seccionTitulo}>Productos del Catálogo</h2>
                                <div className={estilos.contadorProductos}>
                                    {productosVisibles} de {productos.length} visibles
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
                                                            ⭐ Destacado
                                                        </span>
                                                    )}
                                                </div>
                                                <div className={estilos.productoDetalles}>
                                                    <span className={estilos.productoPrecio}>
                                                        RD$ {parseFloat(producto.precio_venta || 0).toLocaleString()}
                                                    </span>
                                                    {producto.precio_oferta && (
                                                        <span className={estilos.productoOferta}>
                                                            Oferta: RD$ {parseFloat(producto.precio_oferta).toLocaleString()}
                                                        </span>
                                                    )}
                                                    <span className={estilos.productoStock}>
                                                        Stock: {producto.stock || 0}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={estilos.productoAcciones}>
                                                <button
                                                    onClick={() => manejarToggleDestacado(producto.id, !esDestacado)}
                                                    className={`${estilos.btnDestacado} ${esDestacado ? estilos.btnDestacadoActivo : ''}`}
                                                    title="Destacar producto"
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
                                                            <span>Visible</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ion-icon name="eye-off-outline"></ion-icon>
                                                            <span>Oculto</span>
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
                        <h3 className={estilos.sidebarTitulo}>Publicación</h3>
                        <div className={estilos.publicacionContenido}>
                            <div className={estilos.publicacionToggle}>
                                <span className={estilos.publicacionLabel}>Estado del Catálogo</span>
                                <button
                                    onClick={() => setConfig({ ...config, activo: !config.activo })}
                                    className={`${estilos.toggle} ${config?.activo ? estilos.toggleActivo : ''}`}
                                >
                                    <span className={estilos.toggleSlider}></span>
                                </button>
                            </div>
                            <p className={estilos.publicacionDescripcion}>
                                {config?.activo
                                    ? 'Tu catálogo está visible públicamente'
                                    : 'Tu catálogo está oculto del público'}
                            </p>
                        </div>
                    </div>

                    {/* Compartir */}
                    {config?.url_slug && (
                        <div className={estilos.sidebarCardCompartir}>
                            <div className={estilos.compartirHeader}>
                                <ion-icon name="link-outline"></ion-icon>
                                <h3 className={estilos.compartirTitulo}>Compartir Catálogo</h3>
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
                                        alert('Generación de QR próximamente')
                                    }}
                                    className={estilos.btnQR}
                                >
                                    <ion-icon name="qr-code-outline"></ion-icon>
                                    <span>Generar Código QR</span>
                                </button>
                                <button
                                    onClick={compartirWhatsApp}
                                    className={estilos.btnWhatsApp}
                                >
                                    📱 Compartir por WhatsApp
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Ayuda */}
                    <div className={estilos.sidebarCardAyuda}>
                        <h3 className={estilos.ayudaTitulo}>💡 Consejo</h3>
                        <p className={estilos.ayudaTexto}>
                            Activa productos destacados para mostrarlos en la portada. 
                            Los productos con ofertas atraen más atención de los clientes.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
