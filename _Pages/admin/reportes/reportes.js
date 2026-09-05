"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import { obtenerReporteVentas, obtenerReporteProductos, obtenerReporteGastos, obtenerReporteClientes, obtenerDatosEmpresa } from './servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './reportes.module.css'

export default function ReportesAdmin() {
    const router = useRouter()
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(false)
    const [procesando, setProcesando] = useState(false)
    
    const [tipoReporte, setTipoReporte] = useState('ventas')
    const [fechaInicio, setFechaInicio] = useState('')
    const [fechaFin, setFechaFin] = useState('')
    const [datosReporte, setDatosReporte] = useState(null)
    const [empresa, setEmpresa] = useState(null)

    useEffect(() => {
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)
        cargarEmpresa()

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

    async function cargarEmpresa() {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresa(res.empresa)
    }

    const simboloMoneda = empresa?.simbolo_moneda || 'RD$'
    const localeEmpresa = empresa?.locale || 'es-DO'

    useEffect(() => {
        const hoy = new Date()
        const hace30Dias = new Date()
        hace30Dias.setDate(hoy.getDate() - 30)
        
        setFechaInicio(hace30Dias.toISOString().split('T')[0])
        setFechaFin(hoy.toISOString().split('T')[0])
    }, [])

    const generarReporte = async () => {
        if (!fechaInicio || !fechaFin) {
            alert(tr('Selecciona el rango de fechas', 'Select date range'))
            return
        }

        if (new Date(fechaInicio) > new Date(fechaFin)) {
            alert(tr('La fecha inicial no puede ser mayor a la final', 'Start date cannot be greater than end date'))
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
                    resultado = { success: false, mensaje: tr('Tipo de reporte invalido', 'Invalid report type') }
            }

            if (resultado.success) {
                setDatosReporte(resultado.datos)
            } else {
                alert(resultado.mensaje || tr('Error al generar reporte', 'Error generating report'))
            }
        } catch (error) {
            console.error('Error al generar reporte:', error)
            alert(tr('Error al generar el reporte', 'Error generating report'))
        } finally {
            setCargando(false)
        }
    }

    const exportarExcel = () => {
        if (!datosReporte) {
            alert(tr('No hay datos para exportar', 'No data to export'))
            return
        }

        setProcesando(true)
        try {
            const wb = XLSX.utils.book_new()
            
            if (tipoReporte === 'ventas') {
                const wsData = [
                    [tr('REPORTE DE VENTAS', 'SALES REPORT')],
                    [tr(`Periodo: ${fechaInicio} al ${fechaFin}`, `Period: ${fechaInicio} to ${fechaFin}`)],
                    [],
                    [tr('Fecha', 'Date'), 'NCF', tr('Cliente', 'Customer'), tr('Subtotal', 'Subtotal'), 'ITBIS', tr('Total', 'Total'), tr('Metodo Pago', 'Payment Method'), tr('Usuario', 'User')],
                    ...datosReporte.ventas.map(v => [
                        new Date(v.fecha_venta).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO'),
                        v.ncf,
                        v.cliente_nombre || tr('Consumidor Final', 'Final Consumer'),
                        parseFloat(v.subtotal),
                        parseFloat(v.itbis),
                        parseFloat(v.total),
                        v.metodo_pago,
                        v.usuario_nombre
                    ]),
                    [],
                    [tr('RESUMEN', 'SUMMARY')],
                    [tr('Total Ventas:', 'Total Sales:'), datosReporte.resumen.total_ventas],
                    [tr('Monto Total:', 'Total Amount:'), parseFloat(datosReporte.resumen.monto_total)],
                    [tr('Promedio por Venta:', 'Average per Sale:'), parseFloat(datosReporte.resumen.promedio_venta)]
                ]

                const ws = XLSX.utils.aoa_to_sheet(wsData)
                
                ws['!cols'] = [
                    { wch: 12 }, { wch: 20 }, { wch: 25 }, { wch: 12 }, 
                    { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 20 }
                ]

                XLSX.utils.book_append_sheet(wb, ws, tr('Ventas', 'Sales'))
            }
            else if (tipoReporte === 'productos') {
                const wsData = [
                    [tr('REPORTE DE PRODUCTOS', 'PRODUCTS REPORT')],
                    [tr(`Periodo: ${fechaInicio} al ${fechaFin}`, `Period: ${fechaInicio} to ${fechaFin}`)],
                    [],
                    [tr('Producto', 'Product'), tr('Codigo', 'Code'), tr('Categoria', 'Category'), tr('Stock Actual', 'Current Stock'), tr('Cantidad Vendida', 'Quantity Sold'), tr('Ingresos', 'Revenue')],
                    ...datosReporte.productos.map(p => [
                        p.nombre,
                        p.codigo_barras || p.sku || 'N/A',
                        p.categoria_nombre || tr('Sin categoria', 'No category'),
                        parseInt(p.stock),
                        parseInt(p.cantidad_vendida),
                        parseFloat(p.ingresos_generados)
                    ]),
                    [],
                    [tr('RESUMEN', 'SUMMARY')],
                    [tr('Total Productos:', 'Total Products:'), datosReporte.resumen.total_productos],
                    [tr('Productos Vendidos:', 'Products Sold:'), datosReporte.resumen.productos_vendidos],
                    [tr('Unidades Vendidas:', 'Units Sold:'), datosReporte.resumen.unidades_vendidas],
                    [tr('Ingresos Totales:', 'Total Revenue:'), parseFloat(datosReporte.resumen.ingresos_totales)]
                ]

                const ws = XLSX.utils.aoa_to_sheet(wsData)
                
                ws['!cols'] = [
                    { wch: 30 }, { wch: 15 }, { wch: 20 }, 
                    { wch: 12 }, { wch: 15 }, { wch: 15 }
                ]

                XLSX.utils.book_append_sheet(wb, ws, tr('Productos', 'Products'))
            }
            else if (tipoReporte === 'gastos') {
                const wsData = [
                    [tr('REPORTE DE GASTOS', 'EXPENSES REPORT')],
                    [tr(`Periodo: ${fechaInicio} al ${fechaFin}`, `Period: ${fechaInicio} to ${fechaFin}`)],
                    [],
                    [tr('Fecha', 'Date'), tr('Concepto', 'Concept'), tr('Categoria', 'Category'), tr('Monto', 'Amount'), tr('Comprobante', 'Voucher'), tr('Usuario', 'User')],
                    ...datosReporte.gastos.map(g => [
                        new Date(g.fecha_gasto).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO'),
                        g.concepto,
                        g.categoria || tr('Sin categoria', 'No category'),
                        parseFloat(g.monto),
                        g.comprobante_numero || 'N/A',
                        g.usuario_nombre
                    ]),
                    [],
                    [tr('RESUMEN', 'SUMMARY')],
                    [tr('Total Gastos:', 'Total Expenses:'), datosReporte.resumen.total_gastos],
                    [tr('Monto Total:', 'Total Amount:'), parseFloat(datosReporte.resumen.monto_total)],
                    [tr('Promedio por Gasto:', 'Average per Expense:'), parseFloat(datosReporte.resumen.promedio_gasto)]
                ]

                const ws = XLSX.utils.aoa_to_sheet(wsData)
                
                ws['!cols'] = [
                    { wch: 12 }, { wch: 30 }, { wch: 20 }, 
                    { wch: 12 }, { wch: 15 }, { wch: 20 }
                ]

                XLSX.utils.book_append_sheet(wb, ws, tr('Gastos', 'Expenses'))
            }
            else if (tipoReporte === 'clientes') {
                const wsData = [
                    [tr('REPORTE DE CLIENTES', 'CUSTOMERS REPORT')],
                    [tr(`Periodo: ${fechaInicio} al ${fechaFin}`, `Period: ${fechaInicio} to ${fechaFin}`)],
                    [],
                    [tr('Cliente', 'Customer'), tr('Documento', 'Document'), tr('Telefono', 'Phone'), tr('Total Compras', 'Total Purchases'), tr('Ultima Compra', 'Last Purchase')],
                    ...datosReporte.clientes.map(c => [
                        c.nombre + (c.apellidos ? ' ' + c.apellidos : ''),
                        c.numero_documento,
                        c.telefono || 'N/A',
                        parseFloat(c.total_compras),
                        c.ultima_compra ? new Date(c.ultima_compra).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO') : 'N/A'
                    ]),
                    [],
                    [tr('RESUMEN', 'SUMMARY')],
                    [tr('Total Clientes:', 'Total Customers:'), datosReporte.resumen.total_clientes],
                    [tr('Clientes Activos:', 'Active Customers:'), datosReporte.resumen.clientes_activos],
                    [tr('Compras Totales:', 'Total Purchases:'), parseFloat(datosReporte.resumen.compras_totales)]
                ]

                const ws = XLSX.utils.aoa_to_sheet(wsData)
                
                ws['!cols'] = [
                    { wch: 30 }, { wch: 15 }, { wch: 15 }, 
                    { wch: 15 }, { wch: 15 }
                ]

                XLSX.utils.book_append_sheet(wb, ws, tr('Clientes', 'Customers'))
            }

            const nombreArchivo = `Reporte_${tipoReporte}_${fechaInicio}_${fechaFin}.xlsx`
            XLSX.writeFile(wb, nombreArchivo)
            
            alert(tr('Reporte exportado exitosamente', 'Report exported successfully'))
        } catch (error) {
            console.error('Error al exportar:', error)
            alert(tr('Error al exportar el reporte', 'Error exporting report'))
        } finally {
            setProcesando(false)
        }
    }

    const formatearMoneda = (monto) => {
        try {
            const numero = new Intl.NumberFormat(localeEmpresa, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(monto || 0)
            return `${simboloMoneda} ${numero}`
        } catch {
            return `${simboloMoneda} ${Number(monto || 0).toFixed(2)}`
        }
    }

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO', {
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
            case 'ventas': return tr('Reporte de Ventas', 'Sales Report')
            case 'productos': return tr('Reporte de Productos', 'Products Report')
            case 'gastos': return tr('Reporte de Gastos', 'Expenses Report')
            case 'clientes': return tr('Reporte de Clientes', 'Customers Report')
            default: return tr('Reporte', 'Report')
        }
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>{tr('Reportes', 'Reports')}</h1>
                    <p className={estilos.subtitulo}>{tr('Genera y exporta reportes del negocio', 'Generate and export business reports')}</p>
                </div>
            </div>

            <div className={`${estilos.panel} ${estilos[tema]}`}>
                <h2 className={estilos.panelTitulo}>{tr('Configurar Reporte', 'Configure Report')}</h2>

                <div className={estilos.formularioReporte}>
                    <div className={estilos.grupoInput}>
                        <label>{tr('Tipo de Reporte', 'Report Type')}</label>
                        <select
                            value={tipoReporte}
                            onChange={(e) => {
                                setTipoReporte(e.target.value)
                                setDatosReporte(null)
                            }}
                            className={estilos.input}
                            disabled={cargando || procesando}
                        >
                            <option value="ventas">{tr('Ventas', 'Sales')}</option>
                            <option value="productos">{tr('Productos', 'Products')}</option>
                            <option value="gastos">{tr('Gastos', 'Expenses')}</option>
                            <option value="clientes">{tr('Clientes', 'Customers')}</option>
                        </select>
                    </div>

                    <div className={estilos.grupoDoble}>
                        <div className={estilos.grupoInput}>
                            <label>{tr('Fecha Inicial', 'Start Date')}</label>
                            <input
                                type="date"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                                className={estilos.input}
                                disabled={cargando || procesando}
                            />
                        </div>

                        <div className={estilos.grupoInput}>
                            <label>{tr('Fecha Final', 'End Date')}</label>
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
                            <span>{cargando ? tr('Generando...', 'Generating...') : tr('Generar Reporte', 'Generate Report')}</span>
                        </button>

                        {datosReporte && (
                            <button
                                onClick={exportarExcel}
                                className={estilos.btnExportar}
                                disabled={cargando || procesando}
                            >
                                <ion-icon name="download-outline"></ion-icon>
                                <span>{procesando ? tr('Exportando...', 'Exporting...') : tr('Exportar a Excel', 'Export to Excel')}</span>
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
                                    <span className={estilos.resumenLabel}>{tr('Total Ventas', 'Total Sales')}</span>
                                    <span className={estilos.resumenValor}>{datosReporte.resumen.total_ventas}</span>
                                </div>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>{tr('Monto Total', 'Total Amount')}</span>
                                    <span className={estilos.resumenValor}>{formatearMoneda(datosReporte.resumen.monto_total)}</span>
                                </div>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>{tr('Promedio', 'Average')}</span>
                                    <span className={estilos.resumenValor}>{formatearMoneda(datosReporte.resumen.promedio_venta)}</span>
                                </div>
                            </>
                        )}

                        {tipoReporte === 'productos' && (
                            <>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>{tr('Total Productos', 'Total Products')}</span>
                                    <span className={estilos.resumenValor}>{datosReporte.resumen.total_productos}</span>
                                </div>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>{tr('Unidades Vendidas', 'Units Sold')}</span>
                                    <span className={estilos.resumenValor}>{datosReporte.resumen.unidades_vendidas}</span>
                                </div>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>{tr('Ingresos', 'Revenue')}</span>
                                    <span className={estilos.resumenValor}>{formatearMoneda(datosReporte.resumen.ingresos_totales)}</span>
                                </div>
                            </>
                        )}

                        {tipoReporte === 'gastos' && (
                            <>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>{tr('Total Gastos', 'Total Expenses')}</span>
                                    <span className={estilos.resumenValor}>{datosReporte.resumen.total_gastos}</span>
                                </div>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>{tr('Monto Total', 'Total Amount')}</span>
                                    <span className={estilos.resumenValor}>{formatearMoneda(datosReporte.resumen.monto_total)}</span>
                                </div>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>{tr('Promedio', 'Average')}</span>
                                    <span className={estilos.resumenValor}>{formatearMoneda(datosReporte.resumen.promedio_gasto)}</span>
                                </div>
                            </>
                        )}

                        {tipoReporte === 'clientes' && (
                            <>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>{tr('Total Clientes', 'Total Customers')}</span>
                                    <span className={estilos.resumenValor}>{datosReporte.resumen.total_clientes}</span>
                                </div>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>{tr('Clientes Activos', 'Active Customers')}</span>
                                    <span className={estilos.resumenValor}>{datosReporte.resumen.clientes_activos}</span>
                                </div>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>{tr('Compras Totales', 'Total Purchases')}</span>
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
                                        <th>{tr('Fecha', 'Date')}</th>
                                        <th>NCF</th>
                                        <th>{tr('Cliente', 'Customer')}</th>
                                        <th>{tr('Subtotal', 'Subtotal')}</th>
                                        <th>ITBIS</th>
                                        <th>{tr('Total', 'Total')}</th>
                                        <th>{tr('Usuario', 'User')}</th>
                                    </tr>
                                )}
                                {tipoReporte === 'productos' && (
                                    <tr>
                                        <th>{tr('Producto', 'Product')}</th>
                                        <th>{tr('Categoria', 'Category')}</th>
                                        <th>Stock</th>
                                        <th>{tr('Cantidad Vendida', 'Quantity Sold')}</th>
                                        <th>{tr('Ingresos', 'Revenue')}</th>
                                    </tr>
                                )}
                                {tipoReporte === 'gastos' && (
                                    <tr>
                                        <th>{tr('Fecha', 'Date')}</th>
                                        <th>{tr('Concepto', 'Concept')}</th>
                                        <th>{tr('Categoria', 'Category')}</th>
                                        <th>{tr('Monto', 'Amount')}</th>
                                        <th>{tr('Usuario', 'User')}</th>
                                    </tr>
                                )}
                                {tipoReporte === 'clientes' && (
                                    <tr>
                                        <th>{tr('Cliente', 'Customer')}</th>
                                        <th>{tr('Documento', 'Document')}</th>
                                        <th>{tr('Telefono', 'Phone')}</th>
                                        <th>{tr('Total Compras', 'Total Purchases')}</th>
                                        <th>{tr('Ultima Compra', 'Last Purchase')}</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody>
                                {tipoReporte === 'ventas' && datosReporte.ventas.map((venta, index) => (
                                    <tr key={index}>
                                        <td>{new Date(venta.fecha_venta).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO')}</td>
                                        <td>{venta.ncf}</td>
                                        <td>{venta.cliente_nombre || tr('Consumidor Final', 'Final Consumer')}</td>
                                        <td>{formatearMoneda(venta.subtotal)}</td>
                                        <td>{formatearMoneda(venta.itbis)}</td>
                                        <td>{formatearMoneda(venta.total)}</td>
                                        <td>{venta.usuario_nombre}</td>
                                    </tr>
                                ))}

                                {tipoReporte === 'productos' && datosReporte.productos.map((producto, index) => (
                                    <tr key={index}>
                                        <td>{producto.nombre}</td>
                                        <td>{producto.categoria_nombre || tr('Sin categoria', 'No category')}</td>
                                        <td>{producto.stock}</td>
                                        <td>{producto.cantidad_vendida}</td>
                                        <td>{formatearMoneda(producto.ingresos_generados)}</td>
                                    </tr>
                                ))}

                                {tipoReporte === 'gastos' && datosReporte.gastos.map((gasto, index) => (
                                    <tr key={index}>
                                        <td>{new Date(gasto.fecha_gasto).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO')}</td>
                                        <td>{gasto.concepto}</td>
                                        <td>{gasto.categoria || tr('Sin categoria', 'No category')}</td>
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
                                        <td>{cliente.ultima_compra ? new Date(cliente.ultima_compra).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO') : 'N/A'}</td>
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