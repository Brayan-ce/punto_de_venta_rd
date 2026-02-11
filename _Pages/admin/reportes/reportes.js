"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import { obtenerReporteVentas, obtenerReporteProductos, obtenerReporteGastos, obtenerReporteClientes } from './servidor'
import estilos from './reportes.module.css'

export default function ReportesAdmin() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(false)
    const [procesando, setProcesando] = useState(false)
    
    const [tipoReporte, setTipoReporte] = useState('ventas')
    const [fechaInicio, setFechaInicio] = useState('')
    const [fechaFin, setFechaFin] = useState('')
    const [datosReporte, setDatosReporte] = useState(null)

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
        const hoy = new Date()
        const hace30Dias = new Date()
        hace30Dias.setDate(hoy.getDate() - 30)
        
        setFechaInicio(hace30Dias.toISOString().split('T')[0])
        setFechaFin(hoy.toISOString().split('T')[0])
    }, [])

    const generarReporte = async () => {
        if (!fechaInicio || !fechaFin) {
            alert('Selecciona el rango de fechas')
            return
        }

        if (new Date(fechaInicio) > new Date(fechaFin)) {
            alert('La fecha inicial no puede ser mayor a la final')
            return
        }

        setCargando(true)
        try {
            let resultado
            
            switch(tipoReporte) {
                case 'ventas':
                    resultado = await obtenerReporteVentas(fechaInicio, fechaFin)
                    break
                case 'productos':
                    resultado = await obtenerReporteProductos(fechaInicio, fechaFin)
                    break
                case 'gastos':
                    resultado = await obtenerReporteGastos(fechaInicio, fechaFin)
                    break
                case 'clientes':
                    resultado = await obtenerReporteClientes(fechaInicio, fechaFin)
                    break
                default:
                    resultado = { success: false, mensaje: 'Tipo de reporte invalido' }
            }

            if (resultado.success) {
                setDatosReporte(resultado.datos)
            } else {
                alert(resultado.mensaje || 'Error al generar reporte')
            }
        } catch (error) {
            console.error('Error al generar reporte:', error)
            alert('Error al generar el reporte')
        } finally {
            setCargando(false)
        }
    }

    const exportarExcel = () => {
        if (!datosReporte) {
            alert('No hay datos para exportar')
            return
        }

        setProcesando(true)
        try {
            const wb = XLSX.utils.book_new()
            
            if (tipoReporte === 'ventas') {
                const wsData = [
                    ['REPORTE DE VENTAS'],
                    [`Periodo: ${fechaInicio} al ${fechaFin}`],
                    [],
                    ['Fecha', 'NCF', 'Cliente', 'Subtotal', 'ITBIS', 'Total', 'Metodo Pago', 'Usuario'],
                    ...datosReporte.ventas.map(v => [
                        new Date(v.fecha_venta).toLocaleDateString('es-DO'),
                        v.ncf,
                        v.cliente_nombre || 'Consumidor Final',
                        parseFloat(v.subtotal),
                        parseFloat(v.itbis),
                        parseFloat(v.total),
                        v.metodo_pago,
                        v.usuario_nombre
                    ]),
                    [],
                    ['RESUMEN'],
                    ['Total Ventas:', datosReporte.resumen.total_ventas],
                    ['Monto Total:', parseFloat(datosReporte.resumen.monto_total)],
                    ['Promedio por Venta:', parseFloat(datosReporte.resumen.promedio_venta)]
                ]

                const ws = XLSX.utils.aoa_to_sheet(wsData)
                
                ws['!cols'] = [
                    { wch: 12 }, { wch: 20 }, { wch: 25 }, { wch: 12 }, 
                    { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 20 }
                ]

                XLSX.utils.book_append_sheet(wb, ws, 'Ventas')
            }
            else if (tipoReporte === 'productos') {
                const wsData = [
                    ['REPORTE DE PRODUCTOS'],
                    [`Periodo: ${fechaInicio} al ${fechaFin}`],
                    [],
                    ['Producto', 'Codigo', 'Categoria', 'Stock Actual', 'Cantidad Vendida', 'Ingresos'],
                    ...datosReporte.productos.map(p => [
                        p.nombre,
                        p.codigo_barras || p.sku || 'N/A',
                        p.categoria_nombre || 'Sin categoria',
                        parseInt(p.stock),
                        parseInt(p.cantidad_vendida),
                        parseFloat(p.ingresos_generados)
                    ]),
                    [],
                    ['RESUMEN'],
                    ['Total Productos:', datosReporte.resumen.total_productos],
                    ['Productos Vendidos:', datosReporte.resumen.productos_vendidos],
                    ['Unidades Vendidas:', datosReporte.resumen.unidades_vendidas],
                    ['Ingresos Totales:', parseFloat(datosReporte.resumen.ingresos_totales)]
                ]

                const ws = XLSX.utils.aoa_to_sheet(wsData)
                
                ws['!cols'] = [
                    { wch: 30 }, { wch: 15 }, { wch: 20 }, 
                    { wch: 12 }, { wch: 15 }, { wch: 15 }
                ]

                XLSX.utils.book_append_sheet(wb, ws, 'Productos')
            }
            else if (tipoReporte === 'gastos') {
                const wsData = [
                    ['REPORTE DE GASTOS'],
                    [`Periodo: ${fechaInicio} al ${fechaFin}`],
                    [],
                    ['Fecha', 'Concepto', 'Categoria', 'Monto', 'Comprobante', 'Usuario'],
                    ...datosReporte.gastos.map(g => [
                        new Date(g.fecha_gasto).toLocaleDateString('es-DO'),
                        g.concepto,
                        g.categoria || 'Sin categoria',
                        parseFloat(g.monto),
                        g.comprobante_numero || 'N/A',
                        g.usuario_nombre
                    ]),
                    [],
                    ['RESUMEN'],
                    ['Total Gastos:', datosReporte.resumen.total_gastos],
                    ['Monto Total:', parseFloat(datosReporte.resumen.monto_total)],
                    ['Promedio por Gasto:', parseFloat(datosReporte.resumen.promedio_gasto)]
                ]

                const ws = XLSX.utils.aoa_to_sheet(wsData)
                
                ws['!cols'] = [
                    { wch: 12 }, { wch: 30 }, { wch: 20 }, 
                    { wch: 12 }, { wch: 15 }, { wch: 20 }
                ]

                XLSX.utils.book_append_sheet(wb, ws, 'Gastos')
            }
            else if (tipoReporte === 'clientes') {
                const wsData = [
                    ['REPORTE DE CLIENTES'],
                    [`Periodo: ${fechaInicio} al ${fechaFin}`],
                    [],
                    ['Cliente', 'Documento', 'Telefono', 'Total Compras', 'Ultima Compra'],
                    ...datosReporte.clientes.map(c => [
                        c.nombre + (c.apellidos ? ' ' + c.apellidos : ''),
                        c.numero_documento,
                        c.telefono || 'N/A',
                        parseFloat(c.total_compras),
                        c.ultima_compra ? new Date(c.ultima_compra).toLocaleDateString('es-DO') : 'N/A'
                    ]),
                    [],
                    ['RESUMEN'],
                    ['Total Clientes:', datosReporte.resumen.total_clientes],
                    ['Clientes Activos:', datosReporte.resumen.clientes_activos],
                    ['Compras Totales:', parseFloat(datosReporte.resumen.compras_totales)]
                ]

                const ws = XLSX.utils.aoa_to_sheet(wsData)
                
                ws['!cols'] = [
                    { wch: 30 }, { wch: 15 }, { wch: 15 }, 
                    { wch: 15 }, { wch: 15 }
                ]

                XLSX.utils.book_append_sheet(wb, ws, 'Clientes')
            }

            const nombreArchivo = `Reporte_${tipoReporte}_${fechaInicio}_${fechaFin}.xlsx`
            XLSX.writeFile(wb, nombreArchivo)
            
            alert('Reporte exportado exitosamente')
        } catch (error) {
            console.error('Error al exportar:', error)
            alert('Error al exportar el reporte')
        } finally {
            setProcesando(false)
        }
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP'
        }).format(monto)
    }

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const obtenerIconoReporte = () => {
        switch(tipoReporte) {
            case 'ventas': return 'cart-outline'
            case 'productos': return 'cube-outline'
            case 'gastos': return 'wallet-outline'
            case 'clientes': return 'people-outline'
            default: return 'document-outline'
        }
    }

    const obtenerTituloReporte = () => {
        switch(tipoReporte) {
            case 'ventas': return 'Reporte de Ventas'
            case 'productos': return 'Reporte de Productos'
            case 'gastos': return 'Reporte de Gastos'
            case 'clientes': return 'Reporte de Clientes'
            default: return 'Reporte'
        }
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Reportes</h1>
                    <p className={estilos.subtitulo}>Genera y exporta reportes del negocio</p>
                </div>
            </div>

            <div className={`${estilos.panel} ${estilos[tema]}`}>
                <h2 className={estilos.panelTitulo}>Configurar Reporte</h2>

                <div className={estilos.formularioReporte}>
                    <div className={estilos.grupoInput}>
                        <label>Tipo de Reporte</label>
                        <select
                            value={tipoReporte}
                            onChange={(e) => {
                                setTipoReporte(e.target.value)
                                setDatosReporte(null)
                            }}
                            className={estilos.input}
                            disabled={cargando || procesando}
                        >
                            <option value="ventas">Ventas</option>
                            <option value="productos">Productos</option>
                            <option value="gastos">Gastos</option>
                            <option value="clientes">Clientes</option>
                        </select>
                    </div>

                    <div className={estilos.grupoDoble}>
                        <div className={estilos.grupoInput}>
                            <label>Fecha Inicial</label>
                            <input
                                type="date"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                                className={estilos.input}
                                disabled={cargando || procesando}
                            />
                        </div>

                        <div className={estilos.grupoInput}>
                            <label>Fecha Final</label>
                            <input
                                type="date"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                                className={estilos.input}
                                disabled={cargando || procesando}
                            />
                        </div>
                    </div>

                    <div className={estilos.botonesReporte}>
                        <button
                            onClick={generarReporte}
                            className={estilos.btnGenerar}
                            disabled={cargando || procesando}
                        >
                            <ion-icon name="analytics-outline"></ion-icon>
                            <span>{cargando ? 'Generando...' : 'Generar Reporte'}</span>
                        </button>

                        {datosReporte && (
                            <button
                                onClick={exportarExcel}
                                className={estilos.btnExportar}
                                disabled={cargando || procesando}
                            >
                                <ion-icon name="download-outline"></ion-icon>
                                <span>{procesando ? 'Exportando...' : 'Exportar a Excel'}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {datosReporte && (
                <div className={`${estilos.panel} ${estilos[tema]}`}>
                    <div className={estilos.reporteHeader}>
                        <div className={estilos.reporteIcono}>
                            <ion-icon name={obtenerIconoReporte()}></ion-icon>
                        </div>
                        <div>
                            <h2 className={estilos.reporteTitulo}>{obtenerTituloReporte()}</h2>
                            <p className={estilos.reporteFecha}>
                                {formatearFecha(fechaInicio)} - {formatearFecha(fechaFin)}
                            </p>
                        </div>
                    </div>

                    <div className={estilos.resumenGrid}>
                        {tipoReporte === 'ventas' && (
                            <>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>Total Ventas</span>
                                    <span className={estilos.resumenValor}>{datosReporte.resumen.total_ventas}</span>
                                </div>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>Monto Total</span>
                                    <span className={estilos.resumenValor}>{formatearMoneda(datosReporte.resumen.monto_total)}</span>
                                </div>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>Promedio</span>
                                    <span className={estilos.resumenValor}>{formatearMoneda(datosReporte.resumen.promedio_venta)}</span>
                                </div>
                            </>
                        )}

                        {tipoReporte === 'productos' && (
                            <>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>Total Productos</span>
                                    <span className={estilos.resumenValor}>{datosReporte.resumen.total_productos}</span>
                                </div>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>Unidades Vendidas</span>
                                    <span className={estilos.resumenValor}>{datosReporte.resumen.unidades_vendidas}</span>
                                </div>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>Ingresos</span>
                                    <span className={estilos.resumenValor}>{formatearMoneda(datosReporte.resumen.ingresos_totales)}</span>
                                </div>
                            </>
                        )}

                        {tipoReporte === 'gastos' && (
                            <>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>Total Gastos</span>
                                    <span className={estilos.resumenValor}>{datosReporte.resumen.total_gastos}</span>
                                </div>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>Monto Total</span>
                                    <span className={estilos.resumenValor}>{formatearMoneda(datosReporte.resumen.monto_total)}</span>
                                </div>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>Promedio</span>
                                    <span className={estilos.resumenValor}>{formatearMoneda(datosReporte.resumen.promedio_gasto)}</span>
                                </div>
                            </>
                        )}

                        {tipoReporte === 'clientes' && (
                            <>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>Total Clientes</span>
                                    <span className={estilos.resumenValor}>{datosReporte.resumen.total_clientes}</span>
                                </div>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>Clientes Activos</span>
                                    <span className={estilos.resumenValor}>{datosReporte.resumen.clientes_activos}</span>
                                </div>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>Compras Totales</span>
                                    <span className={estilos.resumenValor}>{formatearMoneda(datosReporte.resumen.compras_totales)}</span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className={estilos.tablaContainer}>
                        <table className={estilos.tabla}>
                            <thead>
                                {tipoReporte === 'ventas' && (
                                    <tr>
                                        <th>Fecha</th>
                                        <th>NCF</th>
                                        <th>Cliente</th>
                                        <th>Subtotal</th>
                                        <th>ITBIS</th>
                                        <th>Total</th>
                                        <th>Usuario</th>
                                    </tr>
                                )}
                                {tipoReporte === 'productos' && (
                                    <tr>
                                        <th>Producto</th>
                                        <th>Categoria</th>
                                        <th>Stock</th>
                                        <th>Cantidad Vendida</th>
                                        <th>Ingresos</th>
                                    </tr>
                                )}
                                {tipoReporte === 'gastos' && (
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Concepto</th>
                                        <th>Categoria</th>
                                        <th>Monto</th>
                                        <th>Usuario</th>
                                    </tr>
                                )}
                                {tipoReporte === 'clientes' && (
                                    <tr>
                                        <th>Cliente</th>
                                        <th>Documento</th>
                                        <th>Telefono</th>
                                        <th>Total Compras</th>
                                        <th>Ultima Compra</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody>
                                {tipoReporte === 'ventas' && datosReporte.ventas.map((venta, index) => (
                                    <tr key={index}>
                                        <td>{new Date(venta.fecha_venta).toLocaleDateString('es-DO')}</td>
                                        <td>{venta.ncf}</td>
                                        <td>{venta.cliente_nombre || 'Consumidor Final'}</td>
                                        <td>{formatearMoneda(venta.subtotal)}</td>
                                        <td>{formatearMoneda(venta.itbis)}</td>
                                        <td>{formatearMoneda(venta.total)}</td>
                                        <td>{venta.usuario_nombre}</td>
                                    </tr>
                                ))}

                                {tipoReporte === 'productos' && datosReporte.productos.map((producto, index) => (
                                    <tr key={index}>
                                        <td>{producto.nombre}</td>
                                        <td>{producto.categoria_nombre || 'Sin categoria'}</td>
                                        <td>{producto.stock}</td>
                                        <td>{producto.cantidad_vendida}</td>
                                        <td>{formatearMoneda(producto.ingresos_generados)}</td>
                                    </tr>
                                ))}

                                {tipoReporte === 'gastos' && datosReporte.gastos.map((gasto, index) => (
                                    <tr key={index}>
                                        <td>{new Date(gasto.fecha_gasto).toLocaleDateString('es-DO')}</td>
                                        <td>{gasto.concepto}</td>
                                        <td>{gasto.categoria || 'Sin categoria'}</td>
                                        <td>{formatearMoneda(gasto.monto)}</td>
                                        <td>{gasto.usuario_nombre}</td>
                                    </tr>
                                ))}

                                {tipoReporte === 'clientes' && datosReporte.clientes.map((cliente, index) => (
                                    <tr key={index}>
                                        <td>{cliente.nombre} {cliente.apellidos}</td>
                                        <td>{cliente.numero_documento}</td>
                                        <td>{cliente.telefono || 'N/A'}</td>
                                        <td>{formatearMoneda(cliente.total_compras)}</td>
                                        <td>{cliente.ultima_compra ? new Date(cliente.ultima_compra).toLocaleDateString('es-DO') : 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}