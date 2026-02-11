"use client"
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { obtenerComprasObra, obtenerObrasParaCompra } from './servidor'
import estilos from './compras-obra.module.css'

export default function ComprasObraAdmin() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const obraIdParam = searchParams.get('obra')
    
    const [tema, setTema] = useState('light')
    const [compras, setCompras] = useState([])
    const [obras, setObras] = useState([])
    const [filtros, setFiltros] = useState({
        obra_id: obraIdParam || '',
        estado: '',
        tipo_compra: ''
    })
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        // Cargar tema desde localStorage
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
        cargarObras()
    }, [])

    useEffect(() => {
        cargarCompras()
    }, [filtros])

    async function cargarObras() {
        const res = await obtenerObrasParaCompra()
        if (res.success) {
            setObras(res.obras)
        }
    }

    async function cargarCompras() {
        setCargando(true)
        const res = await obtenerComprasObra(filtros)
        if (res.success) {
            setCompras(res.compras)
        }
        setCargando(false)
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 0
        }).format(monto || 0)
    }

    const formatearFecha = (fecha) => {
        if (!fecha) return 'N/A'
        return new Date(fecha).toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div className={estilos.tituloArea}>
                    <h1 className={estilos.titulo}>
                        <ion-icon name="cart-outline"></ion-icon>
                        Compras de Obra
                    </h1>
                    <p className={estilos.subtitulo}>
                        Registro y gestión de compras de materiales para obras
                    </p>
                </div>
                <button 
                    className={estilos.btnNuevo} 
                    onClick={() => router.push('/admin/compras-obra/nuevo')}
                >
                    <ion-icon name="add-circle-outline"></ion-icon>
                    <span>Nueva Compra</span>
                </button>
            </div>

            {/* Filtros */}
            <div className={estilos.filtros}>
                <select
                    value={filtros.obra_id}
                    onChange={(e) => setFiltros(prev => ({ ...prev, obra_id: e.target.value }))}
                >
                    <option value="">Todas las obras</option>
                    {obras.map(obra => (
                        <option key={obra.id} value={obra.id}>
                            {obra.codigo_obra} - {obra.nombre}
                        </option>
                    ))}
                </select>
                <select
                    value={filtros.estado}
                    onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
                >
                    <option value="">Todos los estados</option>
                    <option value="registrada">Registrada</option>
                    <option value="validada">Validada</option>
                    <option value="anulada">Anulada</option>
                </select>
                <select
                    value={filtros.tipo_compra}
                    onChange={(e) => setFiltros(prev => ({ ...prev, tipo_compra: e.target.value }))}
                >
                    <option value="">Todos los tipos</option>
                    <option value="planificada">Planificada</option>
                    <option value="imprevista">Imprevista</option>
                </select>
            </div>

            {/* Lista */}
            {cargando ? (
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline"></ion-icon>
                    <p>Cargando compras...</p>
                </div>
            ) : compras.length === 0 ? (
                <div className={estilos.vacio}>
                    <div className={estilos.ilustracionWrapper}>
                        <img 
                            src="/illustrations3D/_0001.svg" 
                            alt="Ilustración" 
                            className={estilos.ilustracion3D}
                        />
                    </div>
                    <p>No se encontraron compras</p>
                    <small>Intenta ajustar los filtros o crea una nueva compra</small>
                </div>
            ) : (
                <div className={estilos.lista}>
                    {compras.map(compra => (
                        <div 
                            key={compra.id} 
                            className={estilos.tarjeta}
                            onClick={() => router.push(`/admin/compras-obra/ver/${compra.id}`)}
                        >
                            <div className={estilos.tarjetaHeader}>
                                <div>
                                    <h3>Factura #{compra.numero_factura}</h3>
                                    {compra.obra_nombre && (
                                        <p className={estilos.obraNombre}>
                                            {compra.codigo_obra} - {compra.obra_nombre}
                                        </p>
                                    )}
                                </div>
                                <span className={`${estilos.estado} ${estilos[compra.estado]}`}>
                                    {compra.estado}
                                </span>
                            </div>
                            <div className={estilos.tarjetaBody}>
                                <div className={estilos.info}>
                                    {compra.proveedor_nombre && (
                                        <div className={estilos.itemInfo}>
                                            <ion-icon name="storefront-outline"></ion-icon>
                                            <span>{compra.proveedor_nombre}</span>
                                        </div>
                                    )}
                                    <div className={estilos.itemInfo}>
                                        <ion-icon name="calendar-outline"></ion-icon>
                                        <span>{formatearFecha(compra.fecha_compra)}</span>
                                    </div>
                                    <div className={estilos.itemInfo}>
                                        <ion-icon name="cube-outline"></ion-icon>
                                        <span>{compra.cantidad_items || 0} {compra.cantidad_items === 1 ? 'item' : 'items'}</span>
                                    </div>
                                    <div className={estilos.itemInfo}>
                                        <ion-icon name="cash-outline"></ion-icon>
                                        <span className={estilos.monto}>{formatearMoneda(compra.total)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className={estilos.tarjetaFooter}>
                                <button 
                                    className={estilos.btnVer}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        router.push(`/admin/compras-obra/ver/${compra.id}`)
                                    }}
                                >
                                    Ver Detalles
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

