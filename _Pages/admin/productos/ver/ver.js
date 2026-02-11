"use client"
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { obtenerDetalleProducto } from './servidor'
import { ImagenProducto } from '@/utils/imageUtils'
import estilos from './ver.module.css'

export default function VerProductoAdmin() {
    const router = useRouter()
    const params = useParams()
    const productoId = params.id
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [producto, setProducto] = useState(null)

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
    }, [productoId])

    const cargarProducto = async () => {
        try {
            const resultado = await obtenerDetalleProducto(productoId)
            if (resultado.success) {
                setProducto(resultado.producto)
            } else {
                alert(resultado.mensaje || 'Error al cargar producto')
                router.push('/admin/productos')
            }
        } catch (error) {
            console.error('Error al cargar producto:', error)
            alert('Error al cargar datos del producto')
            router.push('/admin/productos')
        } finally {
            setCargando(false)
        }
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2
        }).format(monto)
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando producto...</span>
                </div>
            </div>
        )
    }

    if (!producto) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.error}>
                    <ion-icon name="alert-circle-outline"></ion-icon>
                    <span>No se pudo cargar el producto</span>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Detalle del Producto</h1>
                    <p className={estilos.subtitulo}>Información completa del producto</p>
                </div>
                <div className={estilos.headerAcciones}>
                    <Link
                        href={`/admin/productos/editar/${producto.id}`}
                        className={estilos.btnEditar}
                    >
                        <ion-icon name="create-outline"></ion-icon>
                        <span>Editar</span>
                    </Link>
                    <button
                        className={estilos.btnVolver}
                        onClick={() => router.push('/admin/productos')}
                    >
                        <ion-icon name="arrow-back-outline"></ion-icon>
                        <span>Volver</span>
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
                            />
                        </div>

                        <div className={estilos.estado}>
                            <span className={`${estilos.badge} ${producto.activo ? estilos.activo : estilos.inactivo}`}>
                                {producto.activo ? 'Activo' : 'Inactivo'}
                            </span>
                            {producto.stock <= producto.stock_minimo && (
                                <span className={`${estilos.badge} ${estilos.bajoStock}`}>
                                    Bajo Stock
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
                                <span className={estilos.label}>Código de Barras</span>
                                <span className={estilos.valor}>{producto.codigo_barras || 'N/A'}</span>
                            </div>

                            <div className={estilos.campo}>
                                <span className={estilos.label}>SKU</span>
                                <span className={estilos.valor}>{producto.sku || 'N/A'}</span>
                            </div>

                            <div className={estilos.campo}>
                                <span className={estilos.label}>Categoría</span>
                                <span className={estilos.valor}>{producto.categoria_nombre || 'Sin categoría'}</span>
                            </div>

                            <div className={estilos.campo}>
                                <span className={estilos.label}>Marca</span>
                                <span className={estilos.valor}>{producto.marca_nombre || 'Sin marca'}</span>
                            </div>

                            <div className={estilos.campo}>
                                <span className={estilos.label}>Unidad de Medida</span>
                                <span className={estilos.valor}>
                                    {producto.unidad_medida_nombre} ({producto.unidad_medida_abreviatura})
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className={`${estilos.seccion} ${estilos[tema]}`}>
                        <h3 className={estilos.tituloSeccion}>
                            <ion-icon name="cash-outline"></ion-icon>
                            <span>Precios</span>
                        </h3>

                        <div className={estilos.gridPrecios}>
                            <div className={estilos.precioBox}>
                                <span className={estilos.precioLabel}>Precio de Compra</span>
                                <span className={estilos.precioValor}>{formatearMoneda(producto.precio_compra)}</span>
                            </div>

                            <div className={`${estilos.precioBox} ${estilos.destacado}`}>
                                <span className={estilos.precioLabel}>Precio de Venta</span>
                                <span className={estilos.precioValor}>{formatearMoneda(producto.precio_venta)}</span>
                            </div>

                            {producto.precio_oferta && (
                                <div className={estilos.precioBox}>
                                    <span className={estilos.precioLabel}>Precio de Oferta</span>
                                    <span className={estilos.precioValor}>{formatearMoneda(producto.precio_oferta)}</span>
                                </div>
                            )}

                            {producto.precio_mayorista && (
                                <div className={estilos.precioBox}>
                                    <span className={estilos.precioLabel}>Precio Mayorista</span>
                                    <span className={estilos.precioValor}>
                                        {formatearMoneda(producto.precio_mayorista)}
                                        <small>(desde {producto.cantidad_mayorista} unidades)</small>
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={`${estilos.seccion} ${estilos[tema]}`}>
                        <h3 className={estilos.tituloSeccion}>
                            <ion-icon name="cube-outline"></ion-icon>
                            <span>Inventario</span>
                        </h3>

                        <div className={estilos.stockInfo}>
                            <div className={estilos.stockActual}>
                                <span className={estilos.stockLabel}>Stock Actual</span>
                                <span className={`${estilos.stockValor} ${producto.stock <= producto.stock_minimo ? estilos.bajo : ''}`}>
                                    {producto.stock}
                                </span>
                            </div>

                            <div className={estilos.stockLimites}>
                                <div className={estilos.stockItem}>
                                    <ion-icon name="arrow-down-outline"></ion-icon>
                                    <span>Mínimo: {producto.stock_minimo}</span>
                                </div>
                                <div className={estilos.stockItem}>
                                    <ion-icon name="arrow-up-outline"></ion-icon>
                                    <span>Máximo: {producto.stock_maximo}</span>
                                </div>
                            </div>
                        </div>

                        {(producto.fecha_vencimiento || producto.lote || producto.ubicacion_bodega) && (
                            <div className={estilos.infoAdicional}>
                                {producto.fecha_vencimiento && (
                                    <div className={estilos.campo}>
                                        <span className={estilos.label}>Fecha de Vencimiento</span>
                                        <span className={estilos.valor}>
                                            {new Date(producto.fecha_vencimiento).toLocaleDateString('es-DO')}
                                        </span>
                                    </div>
                                )}

                                {producto.lote && (
                                    <div className={estilos.campo}>
                                        <span className={estilos.label}>Lote</span>
                                        <span className={estilos.valor}>{producto.lote}</span>
                                    </div>
                                )}

                                {producto.ubicacion_bodega && (
                                    <div className={estilos.campo}>
                                        <span className={estilos.label}>Ubicación en Bodega</span>
                                        <span className={estilos.valor}>{producto.ubicacion_bodega}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className={`${estilos.seccion} ${estilos[tema]}`}>
                        <h3 className={estilos.tituloSeccion}>
                            <ion-icon name="settings-outline"></ion-icon>
                            <span>Configuración</span>
                        </h3>

                        <div className={estilos.configuracion}>
                            <div className={estilos.configItem}>
                                <ion-icon name={producto.aplica_itbis ? "checkmark-circle" : "close-circle"}></ion-icon>
                                <span>{producto.aplica_itbis ? 'Aplica ITBIS' : 'No aplica ITBIS'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}