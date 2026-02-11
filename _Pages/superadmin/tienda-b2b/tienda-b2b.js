"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { obtenerConfigTiendaB2B } from './servidor'
import estilos from './tienda-b2b.module.css'

export default function TiendaB2B() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [estadisticas, setEstadisticas] = useState(null)

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
        cargarEstadisticas()
    }, [])

    const cargarEstadisticas = async () => {
        setCargando(true)
        try {
            const resultado = await obtenerConfigTiendaB2B()
            if (resultado.success) {
                setEstadisticas(resultado.estadisticas)
            } else {
                console.error('Error al cargar estadísticas:', resultado.mensaje)
            }
        } catch (error) {
            console.error('Error al cargar estadísticas:', error)
        } finally {
            setCargando(false)
        }
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2
        }).format(monto || 0)
    }

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

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div className={estilos.tituloSection}>
                    <h1 className={estilos.titulo}>Tienda B2B IsiWeek</h1>
                    <p className={estilos.subtitulo}>Gestiona los productos y pedidos de la tienda B2B</p>
                </div>
            </div>

            {estadisticas && (
                <div className={estilos.gridEstadisticas}>
                    <div className={`${estilos.card} ${estilos[tema]}`}>
                        <div className={estilos.cardIcon}>
                            <ion-icon name="cube-outline"></ion-icon>
                        </div>
                        <div className={estilos.cardContent}>
                            <h3 className={estilos.cardTitulo}>Productos</h3>
                            <p className={estilos.cardValor}>{estadisticas.total_productos}</p>
                            <p className={estilos.cardSubtitulo}>{estadisticas.productos_activos} activos</p>
                        </div>
                        <Link href="/superadmin/tienda-b2b/productos" className={estilos.cardLink}>
                            Ver productos
                            <ion-icon name="arrow-forward-outline"></ion-icon>
                        </Link>
                    </div>

                    <div className={`${estilos.card} ${estilos[tema]}`}>
                        <div className={estilos.cardIcon}>
                            <ion-icon name="document-text-outline"></ion-icon>
                        </div>
                        <div className={estilos.cardContent}>
                            <h3 className={estilos.cardTitulo}>Pedidos</h3>
                            <p className={estilos.cardValor}>{estadisticas.total_pedidos}</p>
                            <p className={estilos.cardSubtitulo}>{estadisticas.pedidos_pendientes} pendientes</p>
                        </div>
                        <Link href="/superadmin/tienda-b2b/pedidos" className={estilos.cardLink}>
                            Ver pedidos
                            <ion-icon name="arrow-forward-outline"></ion-icon>
                        </Link>
                    </div>

                    <div className={`${estilos.card} ${estilos[tema]}`}>
                        <div className={estilos.cardIcon}>
                            <ion-icon name="cash-outline"></ion-icon>
                        </div>
                        <div className={estilos.cardContent}>
                            <h3 className={estilos.cardTitulo}>Ventas Totales</h3>
                            <p className={estilos.cardValor}>{formatearMoneda(estadisticas.total_ventas)}</p>
                            <p className={estilos.cardSubtitulo}>Pedidos entregados</p>
                        </div>
                    </div>
                </div>
            )}

            <div className={estilos.accionesRapidas}>
                <Link href="/superadmin/tienda-b2b/productos" className={`${estilos.btnAccion} ${estilos[tema]}`}>
                    <ion-icon name="cube-outline"></ion-icon>
                    <span>Gestionar Productos</span>
                </Link>
                <Link href="/superadmin/tienda-b2b/pedidos" className={`${estilos.btnAccion} ${estilos[tema]}`}>
                    <ion-icon name="document-text-outline"></ion-icon>
                    <span>Ver Pedidos</span>
                </Link>
            </div>
        </div>
    )
}

