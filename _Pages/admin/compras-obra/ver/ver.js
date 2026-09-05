"use client"
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { obtenerCompraObraPorId, obtenerDatosEmpresa } from '../servidor'
import estilos from '../compras-obra.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function VerCompraObra() {
    const router = useRouter()
    const params = useParams()
    const [compra, setCompra] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [empresa, setEmpresa] = useState(null)

    const localeEmpresa = empresa?.locale || 'es-DO'
    const monedaEmpresa = empresa?.moneda || 'DOP'
    const simboloMoneda = empresa?.simbolo_moneda || 'RD$'
    const fmtMoneda = (v) => new Intl.NumberFormat(localeEmpresa, { style: 'currency', currency: monedaEmpresa, minimumFractionDigits: 2 }).format(parseFloat(v) || 0)

    useEffect(() => {
        cargarCompra()
        cargarEmpresa()
    }, [params.id])

    async function cargarEmpresa() {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresa(res.empresa)
    }

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
        return <LoadingScreen />
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
                                            <td>{fmtMoneda(item.precio_unitario)}</td>
                                            <td>{fmtMoneda(item.subtotal)}</td>
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
                        <span>{fmtMoneda(compra.subtotal)}</span>
                    </div>
                    <div>
                        <label>ITBIS:</label>
                        <span>{fmtMoneda(compra.impuesto)}</span>
                    </div>
                    <div className={estilos.total}>
                        <label>Total:</label>
                        <span>{fmtMoneda(compra.total)}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

