"use client"
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { obtenerActivoPorId } from './servidor'
import estilos from './ver.module.css'

export default function VerActivoAdmin() {
    const router = useRouter()
    const params = useParams()
    const activoId = params.id
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [activo, setActivo] = useState(null)

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
        cargarActivo()
    }, [activoId])

    const cargarActivo = async () => {
        try {
            const resultado = await obtenerActivoPorId(activoId)
            if (resultado.success) {
                setActivo(resultado.activo)
            } else {
                alert(resultado.mensaje || 'Error al cargar activo')
                router.push('/admin/activos')
            }
        } catch (error) {
            console.error('Error al cargar activo:', error)
            alert('Error al cargar datos del activo')
            router.push('/admin/activos')
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

    const manejarVender = () => {
        router.push(`/admin/ventas/nueva?activo=${activoId}`)
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando activo...</span>
                </div>
            </div>
        )
    }

    if (!activo) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.error}>
                    <ion-icon name="alert-circle-outline"></ion-icon>
                    <span>No se pudo cargar el activo</span>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Detalle del Activo</h1>
                    <p className={estilos.subtitulo}>Información completa del activo</p>
                </div>
                <div className={estilos.headerAcciones}>
                    <Link
                        href={`/admin/activos/editar/${activo.id}`}
                        className={estilos.btnEditar}
                    >
                        <ion-icon name="create-outline"></ion-icon>
                        <span>Editar</span>
                    </Link>
                    <button
                        className={estilos.btnVolver}
                        onClick={() => router.push('/admin/activos')}
                    >
                        <ion-icon name="arrow-back-outline"></ion-icon>
                        <span>Volver</span>
                    </button>
                </div>
            </div>

            <div className={estilos.contenido}>
                {/* Información Principal */}
                <div className={`${estilos.seccion} ${estilos[tema]}`}>
                    <h3 className={estilos.tituloSeccion}>
                        <ion-icon name="information-circle-outline"></ion-icon>
                        Información Principal
                    </h3>
                    <div className={estilos.gridInfo}>
                        <div className={estilos.campoInfo}>
                            <span className={estilos.labelInfo}>Código de Activo</span>
                            <span className={estilos.valorInfo}>{activo.codigo_activo || 'N/A'}</span>
                        </div>
                        <div className={estilos.campoInfo}>
                            <span className={estilos.labelInfo}>Producto</span>
                            <span className={estilos.valorInfo}>{activo.producto_nombre || 'N/A'}</span>
                        </div>
                        <div className={estilos.campoInfo}>
                            <span className={estilos.labelInfo}>Número de Serie</span>
                            <span className={estilos.valorInfo}>{activo.numero_serie || 'N/A'}</span>
                        </div>
                        <div className={estilos.campoInfo}>
                            <span className={estilos.labelInfo}>Estado</span>
                            <span className={`${estilos.badge} ${estilos[obtenerColorEstado(activo.estado)]}`}>
                                {obtenerEtiquetaEstado(activo.estado)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Detalles Físicos */}
                {(activo.color || activo.anio_fabricacion || activo.vin || activo.numero_motor || activo.numero_placa) && (
                    <div className={`${estilos.seccion} ${estilos[tema]}`}>
                        <h3 className={estilos.tituloSeccion}>
                            <ion-icon name="car-outline"></ion-icon>
                            Detalles Físicos
                        </h3>
                        <div className={estilos.gridInfo}>
                            {activo.color && (
                                <div className={estilos.campoInfo}>
                                    <span className={estilos.labelInfo}>Color</span>
                                    <span className={estilos.valorInfo}>{activo.color}</span>
                                </div>
                            )}
                            {activo.anio_fabricacion && (
                                <div className={estilos.campoInfo}>
                                    <span className={estilos.labelInfo}>Año de Fabricación</span>
                                    <span className={estilos.valorInfo}>{activo.anio_fabricacion}</span>
                                </div>
                            )}
                            {activo.vin && (
                                <div className={estilos.campoInfo}>
                                    <span className={estilos.labelInfo}>VIN</span>
                                    <span className={estilos.valorInfo}>{activo.vin}</span>
                                </div>
                            )}
                            {activo.numero_motor && (
                                <div className={estilos.campoInfo}>
                                    <span className={estilos.labelInfo}>Número de Motor</span>
                                    <span className={estilos.valorInfo}>{activo.numero_motor}</span>
                                </div>
                            )}
                            {activo.numero_placa && (
                                <div className={estilos.campoInfo}>
                                    <span className={estilos.labelInfo}>Número de Placa</span>
                                    <span className={estilos.valorInfo}>{activo.numero_placa}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Información Financiera */}
                <div className={`${estilos.seccion} ${estilos[tema]}`}>
                    <h3 className={estilos.tituloSeccion}>
                        <ion-icon name="cash-outline"></ion-icon>
                        Información Financiera
                    </h3>
                    <div className={estilos.gridInfo}>
                        <div className={estilos.campoInfo}>
                            <span className={estilos.labelInfo}>Precio de Compra</span>
                            <span className={estilos.valorInfo}>{formatearMoneda(activo.precio_compra)}</span>
                        </div>
                        <div className={estilos.campoInfo}>
                            <span className={estilos.labelInfo}>Fecha de Compra</span>
                            <span className={estilos.valorInfo}>{formatearFecha(activo.fecha_compra)}</span>
                        </div>
                        {activo.precio_venta && (
                            <div className={estilos.campoInfo}>
                                <span className={estilos.labelInfo}>Precio de Venta</span>
                                <span className={estilos.valorInfo}>{formatearMoneda(activo.precio_venta)}</span>
                            </div>
                        )}
                        {activo.fecha_venta && (
                            <div className={estilos.campoInfo}>
                                <span className={estilos.labelInfo}>Fecha de Venta</span>
                                <span className={estilos.valorInfo}>{formatearFecha(activo.fecha_venta)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Cliente y Contrato */}
                {(activo.cliente_nombre || activo.numero_contrato) && (
                    <div className={`${estilos.seccion} ${estilos[tema]}`}>
                        <h3 className={estilos.tituloSeccion}>
                            <ion-icon name="person-outline"></ion-icon>
                            Cliente y Contrato
                        </h3>
                        <div className={estilos.gridInfo}>
                            {activo.cliente_nombre && (
                                <div className={estilos.campoInfo}>
                                    <span className={estilos.labelInfo}>Cliente</span>
                                    <span className={estilos.valorInfo}>
                                        {activo.cliente_nombre} {activo.cliente_apellidos || ''}
                                    </span>
                                </div>
                            )}
                            {activo.cliente_documento && (
                                <div className={estilos.campoInfo}>
                                    <span className={estilos.labelInfo}>Documento</span>
                                    <span className={estilos.valorInfo}>{activo.cliente_documento}</span>
                                </div>
                            )}
                            {activo.numero_contrato && (
                                <div className={estilos.campoInfo}>
                                    <span className={estilos.labelInfo}>Contrato</span>
                                    <span className={estilos.valorInfo}>{activo.numero_contrato}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Ubicación y Observaciones */}
                <div className={`${estilos.seccion} ${estilos[tema]}`}>
                    <h3 className={estilos.tituloSeccion}>
                        <ion-icon name="location-outline"></ion-icon>
                        Ubicación y Observaciones
                    </h3>
                    <div className={estilos.gridInfo}>
                        {activo.ubicacion && (
                            <div className={estilos.campoInfo}>
                                <span className={estilos.labelInfo}>Ubicación</span>
                                <span className={estilos.valorInfo}>{activo.ubicacion}</span>
                            </div>
                        )}
                        {activo.observaciones && (
                            <div className={estilos.campoInfo}>
                                <span className={estilos.labelInfo}>Observaciones</span>
                                <span className={estilos.valorInfo}>{activo.observaciones}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className={estilos.footerAcciones}>
                {activo.estado === 'en_stock' && (
                    <button
                        type="button"
                        className={estilos.btnVender}
                        onClick={manejarVender}
                    >
                        <ion-icon name="cart-outline"></ion-icon>
                        Vender Activo
                    </button>
                )}
            </div>
        </div>
    )
}

