"use client"
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { obtenerConducesObra, obtenerObrasParaConduce } from './servidor'
import estilos from './conduces-obra.module.css'

export default function ConducesObraAdmin() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const obraIdParam = searchParams.get('obra')
    
    const [conduces, setConduces] = useState([])
    const [obras, setObras] = useState([])
    const [filtros, setFiltros] = useState({
        obra_id: obraIdParam || '',
        estado: ''
    })
    const [cargando, setCargando] = useState(true)

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

    return (
        <div className={estilos.contenedor}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Conduces de Obra</h1>
                    <p className={estilos.subtitulo}>Despachos de materiales a obras</p>
                </div>
                <button 
                    className={estilos.btnNuevo} 
                    onClick={() => router.push('/admin/conduces-obra/nuevo')}
                >
                    <ion-icon name="add-outline"></ion-icon>
                    <span>Nuevo Conduce</span>
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
                    <option value="emitido">Emitido</option>
                    <option value="entregado">Entregado</option>
                    <option value="anulado">Anulado</option>
                </select>
            </div>

            {/* Lista */}
            {cargando ? (
                <div className={estilos.cargando}>Cargando conduces...</div>
            ) : conduces.length === 0 ? (
                <div className={estilos.vacio}>No se encontraron conduces</div>
            ) : (
                <div className={estilos.lista}>
                    {conduces.map(conduce => (
                        <div key={conduce.id} className={estilos.tarjeta}>
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
                                            <span>Receptor: {conduce.receptor}</span>
                                        </div>
                                    )}
                                    <div className={estilos.itemInfo}>
                                        <ion-icon name="calendar-outline"></ion-icon>
                                        <span>{new Date(conduce.fecha_conduce || conduce.fecha_despacho).toLocaleDateString()}</span>
                                    </div>
                                    <div className={estilos.itemInfo}>
                                        <ion-icon name="cube-outline"></ion-icon>
                                        <span>{conduce.cantidad_items || 0} materiales</span>
                                    </div>
                                    {conduce.chofer && (
                                        <div className={estilos.itemInfo}>
                                            <ion-icon name="car-outline"></ion-icon>
                                            <span>Chofer: {conduce.chofer}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className={estilos.tarjetaFooter}>
                                <button 
                                    className={estilos.btnVer}
                                    onClick={() => router.push(`/admin/conduces-obra/ver/${conduce.id}`)}
                                >
                                    Ver Detalle
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

