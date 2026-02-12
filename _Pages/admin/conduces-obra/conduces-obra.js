"use client"
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { obtenerConducesObra, obtenerObrasParaConduce } from './servidor'
import estilos from './conduces-obra.module.css'

export default function ConducesObraAdmin() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const obraIdParam = searchParams.get('obra')
    
    const [tema, setTema] = useState('light')
    const [conduces, setConduces] = useState([])
    const [obras, setObras] = useState([])
    const [filtros, setFiltros] = useState({
        obra_id: obraIdParam || '',
        estado: ''
    })
    const [cargando, setCargando] = useState(true)

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
        cargarObras()
    }, [])

    useEffect(() => {
        cargarConduces()
    }, [filtros])

    async function cargarObras() {
        const res = await obtenerObrasParaConduce()
        if (res.success) {
            setObras(res.obras)
        }
    }

    async function cargarConduces() {
        setCargando(true)
        const res = await obtenerConducesObra(filtros)
        if (res.success) {
            setConduces(res.conduces)
        }
        setCargando(false)
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
                        <ion-icon name="document-text-outline"></ion-icon>
                        Conduces de Obra
                    </h1>
                    <p className={estilos.subtitulo}>
                        Despachos de materiales a obras
                    </p>
                </div>
                <button 
                    className={estilos.btnNuevo} 
                    onClick={() => router.push('/admin/conduces-obra/nuevo')}
                >
                    <ion-icon name="add-circle-outline"></ion-icon>
                    <span>Nuevo Conduce</span>
                </button>
            </div>

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
                    <option value="emitido">Emitido</option>
                    <option value="entregado">Entregado</option>
                    <option value="anulado">Anulado</option>
                </select>
            </div>

            {cargando ? (
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline"></ion-icon>
                    <p>Cargando conduces...</p>
                </div>
            ) : conduces.length === 0 ? (
                <div className={estilos.vacio}>
                    <div className={estilos.ilustracionWrapper}>
                        <img 
                            src="/illustrations3D/_0001.svg" 
                            alt="Ilustración" 
                            className={estilos.ilustracion3D}
                        />
                    </div>
                    <p>No se encontraron conduces</p>
                    <small>Intenta ajustar los filtros o crea un nuevo conduce</small>
                </div>
            ) : (
                <div className={estilos.lista}>
                    {conduces.map(conduce => (
                        <div 
                            key={conduce.id} 
                            className={estilos.tarjeta}
                            onClick={() => router.push(`/admin/conduces-obra/ver/${conduce.id}`)}
                        >
                            <div className={estilos.tarjetaHeader}>
                                <div>
                                    <h3>{conduce.numero_conduce}</h3>
                                    {conduce.obra_nombre && (
                                        <p className={estilos.obraNombre}>
                                            {conduce.codigo_obra} - {conduce.obra_nombre}
                                        </p>
                                    )}
                                </div>
                                <span className={`${estilos.estado} ${estilos[conduce.estado]}`}>
                                    {conduce.estado}
                                </span>
                            </div>
                            <div className={estilos.tarjetaBody}>
                                <div className={estilos.info}>
                                    {conduce.receptor && (
                                        <div className={estilos.itemInfo}>
                                            <ion-icon name="person-outline"></ion-icon>
                                            <span>{conduce.receptor}</span>
                                        </div>
                                    )}
                                    <div className={estilos.itemInfo}>
                                        <ion-icon name="calendar-outline"></ion-icon>
                                        <span>{formatearFecha(conduce.fecha_conduce || conduce.fecha_despacho)}</span>
                                    </div>
                                    <div className={estilos.itemInfo}>
                                        <ion-icon name="cube-outline"></ion-icon>
                                        <span>{conduce.cantidad_items || 0} {conduce.cantidad_items === 1 ? 'material' : 'materiales'}</span>
                                    </div>
                                    {conduce.chofer && (
                                        <div className={estilos.itemInfo}>
                                            <ion-icon name="car-outline"></ion-icon>
                                            <span>{conduce.chofer}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className={estilos.tarjetaFooter}>
                                <button 
                                    className={estilos.btnVer}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        router.push(`/admin/conduces-obra/ver/${conduce.id}`)
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