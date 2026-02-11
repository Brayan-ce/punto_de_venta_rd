"use client"
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { obtenerConduceObraPorId } from '../servidor'
import estilos from '../conduces-obra.module.css'

export default function VerConduceObra() {
    const router = useRouter()
    const params = useParams()
    const [conduce, setConduce] = useState(null)
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        cargarConduce()
    }, [params.id])

    async function cargarConduce() {
        const res = await obtenerConduceObraPorId(params.id)
        if (res.success) {
            setConduce(res.conduce)
        } else {
            alert(res.mensaje || 'Error al cargar conduce')
            router.push('/admin/conduces-obra')
        }
        setCargando(false)
    }

    if (cargando) {
        return <div className={estilos.cargando}>Cargando...</div>
    }

    if (!conduce) {
        return <div className={estilos.vacio}>Conduce no encontrado</div>
    }

    return (
        <div className={estilos.contenedor}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>{conduce.numero_conduce}</h1>
                    {conduce.obra_nombre && (
                        <p className={estilos.obraNombre}>
                            {conduce.codigo_obra} - {conduce.obra_nombre}
                        </p>
                    )}
                </div>
                <button onClick={() => router.back()} className={estilos.btnVolver}>
                    ← Volver
                </button>
            </div>

            <div className={estilos.detalle}>
                <div className={estilos.seccion}>
                    <h2>Información General</h2>
                    <div className={estilos.infoGrid}>
                        {conduce.receptor && (
                            <div>
                                <label>Receptor</label>
                                <span>{conduce.receptor}</span>
                            </div>
                        )}
                        {conduce.chofer && (
                            <div>
                                <label>Chofer</label>
                                <span>{conduce.chofer}</span>
                            </div>
                        )}
                        {conduce.vehiculo && (
                            <div>
                                <label>Vehículo</label>
                                <span>{conduce.vehiculo}</span>
                            </div>
                        )}
                        {conduce.placa && (
                            <div>
                                <label>Placa</label>
                                <span>{conduce.placa}</span>
                            </div>
                        )}
                        <div>
                            <label>Fecha de Despacho</label>
                            <span>{new Date(conduce.fecha_conduce || conduce.fecha_despacho).toLocaleDateString()}</span>
                        </div>
                        <div>
                            <label>Estado</label>
                            <span className={`${estilos.badge} ${estilos[conduce.estado]}`}>
                                {conduce.estado}
                            </span>
                        </div>
                    </div>
                </div>

                {conduce.detalle && conduce.detalle.length > 0 && (
                    <div className={estilos.seccion}>
                        <h2>Materiales Despachados</h2>
                        <div className={estilos.tablaDetalle}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Material</th>
                                        <th>Unidad</th>
                                        <th>Cantidad</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {conduce.detalle.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.material_nombre}</td>
                                            <td>{item.unidad_medida || '-'}</td>
                                            <td>{item.cantidad_despachada}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {conduce.observaciones && (
                    <div className={estilos.seccion}>
                        <h2>Observaciones</h2>
                        <p>{conduce.observaciones}</p>
                    </div>
                )}
            </div>
        </div>
    )
}

