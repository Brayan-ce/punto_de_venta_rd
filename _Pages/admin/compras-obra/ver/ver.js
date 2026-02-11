"use client"
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { obtenerCompraObraPorId } from '../servidor'
import estilos from '../compras-obra.module.css'

export default function VerCompraObra() {
    const router = useRouter()
    const params = useParams()
    const [compra, setCompra] = useState(null)
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        cargarCompra()
    }, [params.id])

    async function cargarCompra() {
        const res = await obtenerCompraObraPorId(params.id)
        if (res.success) {
            setCompra(res.compra)
        } else {
            alert(res.mensaje || 'Error al cargar compra')
            router.push('/admin/compras-obra')
        }
        setCargando(false)
    }

    if (cargando) {
        return <div className={estilos.cargando}>Cargando...</div>
    }

    if (!compra) {
        return <div className={estilos.vacio}>Compra no encontrada</div>
    }

    return (
        <div className={estilos.contenedor}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Compra #{compra.numero_factura}</h1>
                    {compra.obra_nombre && (
                        <p className={estilos.obraNombre}>
                            {compra.codigo_obra} - {compra.obra_nombre}
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
                        <div>
                            <label>Proveedor</label>
                            <span>{compra.proveedor_nombre || 'N/A'}</span>
                        </div>
                        <div>
                            <label>Fecha de Compra</label>
                            <span>{new Date(compra.fecha_compra).toLocaleDateString()}</span>
                        </div>
                        <div>
                            <label>Forma de Pago</label>
                            <span>{compra.forma_pago}</span>
                        </div>
                        <div>
                            <label>Estado</label>
                            <span className={`${estilos.badge} ${estilos[compra.estado]}`}>
                                {compra.estado}
                            </span>
                        </div>
                    </div>
                </div>

                {compra.detalle && compra.detalle.length > 0 && (
                    <div className={estilos.seccion}>
                        <h2>Detalle de Materiales</h2>
                        <div className={estilos.tablaDetalle}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Material</th>
                                        <th>Unidad</th>
                                        <th>Cantidad</th>
                                        <th>Precio Unit.</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {compra.detalle.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.material_nombre}</td>
                                            <td>{item.unidad_medida || '-'}</td>
                                            <td>{item.cantidad}</td>
                                            <td>RD$ {parseFloat(item.precio_unitario).toLocaleString()}</td>
                                            <td>RD$ {parseFloat(item.subtotal).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className={estilos.totales}>
                    <div>
                        <label>Subtotal:</label>
                        <span>RD$ {parseFloat(compra.subtotal || 0).toLocaleString()}</span>
                    </div>
                    <div>
                        <label>ITBIS:</label>
                        <span>RD$ {parseFloat(compra.impuesto || 0).toLocaleString()}</span>
                    </div>
                    <div className={estilos.total}>
                        <label>Total:</label>
                        <span>RD$ {parseFloat(compra.total || 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

