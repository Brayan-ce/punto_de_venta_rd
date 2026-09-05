"use client"
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { obtenerDetalleProducto } from './servidor'
import { obtenerDatosEmpresa } from '../servidor'
import { ImagenProducto } from '@/utils/imageUtils'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './ver.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function VerProductoAdmin({ returnPath = '/admin/productos' }) {
    const router = useRouter()
    const params = useParams()
    const productoId = params.id
    const { t, language } = useLanguage()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [producto, setProducto] = useState(null)
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
        cargarProducto()
        cargarEmpresa()
    }, [productoId])

    async function cargarEmpresa() {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresa(res.empresa)
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

    const cargarProducto = async () => {
        try {
            const resultado = await obtenerDetalleProducto(productoId)
            if (resultado.success) {
                setProducto(resultado.producto)
            } else {
                alert(resultado.mensaje || (language === 'en' ? 'Error loading product' : 'Error al cargar producto'))
                router.push(returnPath)
            }
        } catch (error) {
            console.error('Error al cargar producto:', error)
            alert(language === 'en' ? 'Error loading product data' : 'Error al cargar datos del producto')
            router.push(returnPath)
        } finally {
            setCargando(false)
        }
    }


    if (cargando) {
        return <LoadingScreen />
    }

    if (!producto) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.error}>
                    <ion-icon name="alert-circle-outline"></ion-icon>
                    <span>{t('pages.noPudoCargarse')}</span>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>{t('pages.detalleProducto')}</h1>
                    <p className={estilos.subtitulo}>{t('pages.informacionCompleta')}</p>
                </div>
                <div className={estilos.headerAcciones}>
                    <Link
                        href={`${returnPath === '/vendedor/productos' ? '/vendedor' : '/admin'}/productos/editar/${producto.id}`}
                        className={estilos.btnEditar}
                    >
                        <ion-icon name="create-outline"></ion-icon>
                        <span>{t('buttons.editar')}</span>
                    </Link>
                    <button
                        className={estilos.btnVolver}
                        onClick={() => router.push(returnPath)}
                    >
                        <ion-icon name="arrow-back-outline"></ion-icon>
                        <span>{t('pages.volver')}</span>
                    </button>
                </div>
            </div>

            <div className={estilos.contenido}>
                <div className={estilos.columnaIzquierda}>
                    <div className={`${estilos.seccion} ${estilos[tema]}`}>
                        <div className={estilos.imagenContainer}>
                            <ImagenProducto
                                src={producto.imagen_url}
                                alt={producto.nombre}
                                className={estilos.imagen}
                                placeholder={true}
                                placeholderClassName={estilos.imagenPlaceholder}
                                placeholderText={language === 'en' ? 'No image' : 'Sin imagen'}
                            />
                        </div>

                        <div className={estilos.estado}>
                            <span className={`${estilos.badge} ${producto.activo ? estilos.activo : estilos.inactivo}`}>
                                {producto.activo ? t('status.activo') : t('status.inactivo')}
                            </span>
                            {producto.stock <= producto.stock_minimo && (
                                <span className={`${estilos.badge} ${estilos.bajoStock}`}>
                                    {t('pages.bajoStock')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className={estilos.columnaDerecha}>
                    <div className={`${estilos.seccion} ${estilos[tema]}`}>
                        <h2 className={estilos.nombreProducto}>{producto.nombre}</h2>
                        
                        {producto.descripcion && (
                            <p className={estilos.descripcion}>{producto.descripcion}</p>
                        )}

                        <div className={estilos.grid}>
                            <div className={estilos.campo}>
                                <span className={estilos.label}>{t('pages.codigoBarras')}</span>
                                <span className={estilos.valor}>{producto.codigo_barras || (language === 'en' ? 'N/A' : 'N/D')}</span>
                            </div>

                            <div className={estilos.campo}>
                                <span className={estilos.label}>{t('pages.sku')}</span>
                                <span className={estilos.valor}>{producto.sku || (language === 'en' ? 'N/A' : 'N/D')}</span>
                            </div>

                            <div className={estilos.campo}>
                                <span className={estilos.label}>{t('pages.categoria')}</span>
                                <span className={estilos.valor}>{producto.categoria_nombre || t('pages.sinCategoria')}</span>
                            </div>

                            <div className={estilos.campo}>
                                <span className={estilos.label}>{t('pages.marca')}</span>
                                <span className={estilos.valor}>{producto.marca_nombre || t('pages.sinMarca')}</span>
                            </div>

                            <div className={estilos.campo}>
                                <span className={estilos.label}>{t('pages.unidadMedida')}</span>
                                <span className={estilos.valor}>
                                    {producto.unidad_medida_nombre} ({producto.unidad_medida_abreviatura})
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className={`${estilos.seccion} ${estilos[tema]}`}>
                        <h3 className={estilos.tituloSeccion}>
                            <ion-icon name="cash-outline"></ion-icon>
                            <span>{t('pages.precios')}</span>
                        </h3>

                        <div className={estilos.gridPrecios}>
                            <div className={estilos.precioBox}>
                                <span className={estilos.precioLabel}>{t('pages.precioCompra')}</span>
                                <span className={estilos.precioValor}>{formatearMoneda(producto.precio_compra)}</span>
                            </div>

                            <div className={`${estilos.precioBox} ${estilos.destacado}`}>
                                <span className={estilos.precioLabel}>{t('pages.precioVenta')}</span>
                                <span className={estilos.precioValor}>{formatearMoneda(producto.precio_venta)}</span>
                            </div>

                            {producto.precio_oferta && (
                                <div className={estilos.precioBox}>
                                    <span className={estilos.precioLabel}>{t('pages.precioOferta')}</span>
                                    <span className={estilos.precioValor}>{formatearMoneda(producto.precio_oferta)}</span>
                                </div>
                            )}

                            {producto.precio_mayorista && (
                                <div className={estilos.precioBox}>
                                    <span className={estilos.precioLabel}>{t('pages.precioMayorista')}</span>
                                    <span className={estilos.precioValor}>
                                        {formatearMoneda(producto.precio_mayorista)}
                                        <small>({t('pages.desde')} {producto.cantidad_mayorista} unidades)</small>
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={`${estilos.seccion} ${estilos[tema]}`}>
                        <h3 className={estilos.tituloSeccion}>
                            <ion-icon name="cube-outline"></ion-icon>
                            <span>{t('pages.inventario')}</span>
                        </h3>

                        <div className={estilos.stockInfo}>
                            <div className={estilos.stockActual}>
                                <span className={estilos.stockLabel}>{t('pages.stockActual')}</span>
                                <span className={`${estilos.stockValor} ${producto.stock <= producto.stock_minimo ? estilos.bajo : ''}`}>
                                    {producto.stock}
                                </span>
                            </div>

                            <div className={estilos.stockLimites}>
                                <div className={estilos.stockItem}>
                                    <ion-icon name="arrow-down-outline"></ion-icon>
                                    <span>{t('pages.minimo_colon')} {producto.stock_minimo}</span>
                                </div>
                                <div className={estilos.stockItem}>
                                    <ion-icon name="arrow-up-outline"></ion-icon>
                                    <span>{t('pages.maximo_colon')} {producto.stock_maximo}</span>
                                </div>
                            </div>
                        </div>

                        {(producto.fecha_vencimiento || producto.lote || producto.ubicacion_bodega) && (
                            <div className={estilos.infoAdicional}>
                                {producto.fecha_vencimiento && (
                                    <div className={estilos.campo}>
                                        <span className={estilos.label}>{t('pages.fechaVencimiento')}</span>
                                        <span className={estilos.valor}>
                                            {new Date(producto.fecha_vencimiento).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO')}
                                        </span>
                                    </div>
                                )}

                                {producto.lote && (
                                    <div className={estilos.campo}>
                                        <span className={estilos.label}>{t('pages.lote')}</span>
                                        <span className={estilos.valor}>{producto.lote}</span>
                                    </div>
                                )}

                                {producto.ubicacion_bodega && (
                                    <div className={estilos.campo}>
                                        <span className={estilos.label}>{t('pages.ubicacionBodega')}</span>
                                        <span className={estilos.valor}>{producto.ubicacion_bodega}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className={`${estilos.seccion} ${estilos[tema]}`}>
                        <h3 className={estilos.tituloSeccion}>
                            <ion-icon name="settings-outline"></ion-icon>
                            <span>{t('pages.configuracion')}</span>
                        </h3>

                        <div className={estilos.configuracion}>
                            <div className={estilos.configItem}>
                                <ion-icon name={producto.aplica_itbis ? "checkmark-circle" : "close-circle"}></ion-icon>
                                <span>{producto.aplica_itbis ? t('pages.aplicaITBIS') : t('pages.noAplicaITBIS')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}