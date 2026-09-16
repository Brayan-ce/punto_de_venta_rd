"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import { obtenerReporteVentas, obtenerReporteProductos, obtenerReporteCompras, obtenerReporteCuentasPorCobrar, obtenerReporteCuentasPorPagar, obtenerReporteGastos, obtenerReporteClientes, obtenerReporteInventario, obtenerReporteResumen, obtenerDatosEmpresa } from './servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './reportes.module.css'

const CLIENTES_POR_PAGINA = 25

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
    const [paginaClientes, setPaginaClientes] = useState(0)
    const [agrupacionResumen, setAgrupacionResumen] = useState('dia')
    const [busqueda, setBusqueda] = useState('')
    const [paginaTabla, setPaginaTabla] = useState(0)

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
                case 'resumen':
                    resultado = await obtenerReporteResumen(fechaInicio, fechaFin)
                    break
                case 'ventas':
                    resultado = await obtenerReporteVentas(fechaInicio, fechaFin)
                    break
                case 'productos':
                    resultado = await obtenerReporteProductos(fechaInicio, fechaFin)
                    break
                case 'compras':
                    resultado = await obtenerReporteCompras(fechaInicio, fechaFin)
                    break
                case 'cxc':
                    resultado = await obtenerReporteCuentasPorCobrar()
                    break
                case 'cxp':
                    resultado = await obtenerReporteCuentasPorPagar()
                    break
                case 'inventario':
                    resultado = await obtenerReporteInventario()
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
                setPaginaClientes(0)
                setPaginaTabla(0)
                setBusqueda('')
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
                    [tr('Producto', 'Product'), tr('Codigo', 'Code'), tr('Categoria', 'Category'), tr('Stock Actual', 'Current Stock'), tr('Cantidad Vendida', 'Quantity Sold'), tr('Ingresos', 'Revenue'), tr('Costo Total', 'Total Cost'), tr('Beneficio', 'Profit')],
                    ...datosReporte.productos.map(p => [
                        p.nombre,
                        p.codigo_barras || p.sku || 'N/A',
                        p.categoria_nombre || tr('Sin categoria', 'No category'),
                        parseInt(p.stock),
                        parseInt(p.cantidad_vendida),
                        parseFloat(p.ingresos_generados),
                        parseFloat(p.costo_total),
                        parseFloat(p.beneficio)
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
                    { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
                ]

                XLSX.utils.book_append_sheet(wb, ws, tr('Productos', 'Products'))
            }
            else if (tipoReporte === 'compras') {
                const wsData = [
                    [tr('REPORTE DE COMPRAS', 'PURCHASES REPORT')],
                    [tr(`Periodo: ${fechaInicio} al ${fechaFin}`, `Period: ${fechaInicio} to ${fechaFin}`)],
                    [],
                    [tr('Fecha', 'Date'), 'NCF', tr('Proveedor', 'Supplier'), tr('Subtotal', 'Subtotal'), 'ITBIS', tr('Total', 'Total'), tr('Metodo Pago', 'Payment Method')],
                    ...datosReporte.compras.map(c => [new Date(c.fecha_compra).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO'), c.ncf || 'N/A', c.proveedor_nombre, parseFloat(c.subtotal), parseFloat(c.itbis), parseFloat(c.total), c.metodo_pago]),
                    [],
                    [tr('DETALLE POR PRODUCTO', 'DETAIL BY PRODUCT')],
                    [tr('Producto', 'Product'), tr('Codigo', 'Code'), tr('Cantidad', 'Quantity'), tr('Costo Total', 'Total Cost'), tr('Costo Promedio', 'Average Cost')],
                    ...datosReporte.detalle.map(p => [p.nombre, p.codigo_barras || p.sku || 'N/A', parseFloat(p.cantidad_comprada), parseFloat(p.costo_total), parseFloat(p.costo_promedio)]),
                    [],
                    [tr('RESUMEN', 'SUMMARY')],
                    [tr('Total Compras:', 'Total Purchases:'), datosReporte.resumen.total_compras],
                    [tr('Subtotal:', 'Subtotal:'), parseFloat(datosReporte.resumen.subtotal)],
                    ['ITBIS:', parseFloat(datosReporte.resumen.itbis)],
                    [tr('Total:', 'Total:'), parseFloat(datosReporte.resumen.total)]
                ]
                const ws = XLSX.utils.aoa_to_sheet(wsData)
                ws['!cols'] = [{ wch: 13 }, { wch: 20 }, { wch: 28 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }]
                XLSX.utils.book_append_sheet(wb, ws, tr('Compras', 'Purchases'))
            }
            else if (tipoReporte === 'cxc') {
                const wsData = [
                    [tr('REPORTE DE CUENTAS POR COBRAR', 'ACCOUNTS RECEIVABLE REPORT')],
                    [],
                    [tr('Cliente', 'Customer'), tr('Documento', 'Document'), 'NCF', tr('Monto Total', 'Total Amount'), tr('Pagado', 'Paid'), tr('Saldo', 'Balance'), tr('Vencimiento', 'Due Date'), tr('Días Atraso', 'Days Late'), tr('Antigüedad', 'Aging'), tr('Estado', 'Status')],
                    ...datosReporte.detalle.map(c => [`${c.nombre} ${c.apellidos || ''}`.trim(), c.cliente_documento || 'N/A', c.ncf || 'N/A', parseFloat(c.monto_total), parseFloat(c.monto_pagado), parseFloat(c.saldo_pendiente), c.fecha_vencimiento || 'N/A', c.dias_atraso, c.rango_antiguedad, c.estado_cxc]),
                    [],
                    [tr('RESUMEN POR ANTIGÜEDAD', 'AGING SUMMARY')],
                    [tr('Rango', 'Range'), tr('Cuentas', 'Accounts'), tr('Saldo', 'Balance'), tr('Días Promedio', 'Average Days'), tr('Monto Vencido', 'Overdue Amount')],
                    ...datosReporte.resumen.map(c => [c.rango_antiguedad, c.cantidad_cuentas, parseFloat(c.monto_pendiente), parseFloat(c.dias_promedio), parseFloat(c.monto_vencido)])
                ]
                const ws = XLSX.utils.aoa_to_sheet(wsData)
                ws['!cols'] = [{ wch: 28 }, { wch: 16 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 13 }, { wch: 16 }, { wch: 14 }]
                XLSX.utils.book_append_sheet(wb, ws, tr('Cuentas por Cobrar', 'Receivables'))
            }
            else if (tipoReporte === 'cxp') {
                const wsData = [
                    [tr('REPORTE DE CUENTAS POR PAGAR', 'ACCOUNTS PAYABLE REPORT')],
                    [],
                    [tr('Proveedor', 'Supplier'), 'RNC', 'NCF', tr('Fecha', 'Date'), tr('Total', 'Total'), tr('Pagado', 'Paid'), tr('Saldo', 'Balance'), tr('Vencimiento', 'Due Date'), tr('Días', 'Days'), tr('Estado', 'Status')],
                    ...datosReporte.detalle.map(c => [c.proveedor_nombre, c.proveedor_rnc || 'N/A', c.ncf || 'N/A', c.fecha_emision ? new Date(c.fecha_emision).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO') : 'N/A', parseFloat(c.monto_total), parseFloat(c.monto_pagado), parseFloat(c.saldo_pendiente), c.fecha_vencimiento || 'N/A', c.dias_documento, c.estado]),
                    [],
                    [tr('RESUMEN', 'SUMMARY')],
                    [tr('Total Cuentas:', 'Total Accounts:'), datosReporte.resumen.total_cuentas],
                    [tr('Saldo Total:', 'Total Balance:'), parseFloat(datosReporte.resumen.saldo_total)],
                    [tr('Saldo Vencido:', 'Overdue Balance:'), parseFloat(datosReporte.resumen.saldo_vencido || 0)]
                ]
                const ws = XLSX.utils.aoa_to_sheet(wsData)
                ws['!cols'] = [{ wch: 28 }, { wch: 16 }, { wch: 20 }, { wch: 15 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 15 }, { wch: 10 }, { wch: 14 }]
                XLSX.utils.book_append_sheet(wb, ws, tr('Cuentas por Pagar', 'Payables'))
            }
            else if (tipoReporte === 'inventario') {
                const wsData = [
                    [tr('REPORTE DE INVENTARIO (VENCIMIENTOS/BODEGA)', 'INVENTORY REPORT (EXPIRY/LOCATION)')],
                    [],
                    [tr('Producto', 'Product'), 'SKU', tr('Categoria', 'Category'), tr('Stock', 'Stock'), tr('Vencimiento', 'Expiry'), tr('Dias', 'Days'), tr('Lote', 'Batch'), tr('Ubicacion', 'Location'), tr('Estado', 'Status')],
                    ...datosReporte.detalle.map(p => [p.nombre, p.sku || 'N/A', p.categoria_nombre, p.stock, p.fecha_vencimiento || 'N/A', p.dias_para_vencer ?? 'N/A', p.lote || 'N/A', p.ubicacion_bodega || 'N/A', p.estado_vencimiento]),
                    [],
                    [tr('PRODUCTOS POR UBICACION', 'PRODUCTS BY LOCATION')],
                    [tr('Ubicacion', 'Location'), tr('Cantidad Productos', 'Product Count'), tr('Stock Total', 'Total Stock')],
                    ...datosReporte.porBodega.map(b => [b.ubicacion_bodega, b.cantidad_productos, b.stock_total])
                ]
                const ws = XLSX.utils.aoa_to_sheet(wsData)
                ws['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 18 }, { wch: 10 }, { wch: 14 }, { wch: 8 }, { wch: 16 }, { wch: 20 }, { wch: 14 }]
                XLSX.utils.book_append_sheet(wb, ws, tr('Inventario', 'Inventory'))
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
            else if (tipoReporte === 'resumen') {
                const filaResumen = (r) => [
                    r.periodo,
                    Number(r.cantidad),
                    parseFloat(r.subtotal),
                    parseFloat(r.itbis),
                    parseFloat(r.total),
                    parseFloat(r.efectivo),
                    parseFloat(r.credito)
                ]
                const wsData = [
                    [tr('RESUMEN DE VENTAS', 'SALES SUMMARY')],
                    [tr(`Periodo: ${fechaInicio} al ${fechaFin}`, `Period: ${fechaInicio} to ${fechaFin}`)],
                    [],
                    [tr('POR DÍA', 'BY DAY')],
                    [tr('Fecha', 'Date'), tr('Cantidad', 'Count'), tr('Subtotal', 'Subtotal'), 'ITBIS', tr('Total', 'Total'), tr('Efectivo', 'Cash'), tr('Crédito', 'Credit')],
                    ...(datosReporte.porDia || []).map(filaResumen),
                    [],
                    [tr('POR MES', 'BY MONTH')],
                    [tr('Mes', 'Month'), tr('Cantidad', 'Count'), tr('Subtotal', 'Subtotal'), 'ITBIS', tr('Total', 'Total'), tr('Efectivo', 'Cash'), tr('Crédito', 'Credit')],
                    ...(datosReporte.porMes || []).map(filaResumen),
                    [],
                    [tr('TOTALES', 'TOTALS')],
                    [tr('Total Ventas:', 'Total Sales:'), Number(datosReporte.resumen.total_ventas)],
                    [tr('Subtotal:', 'Subtotal:'), parseFloat(datosReporte.resumen.total_subtotal)],
                    ['ITBIS:', parseFloat(datosReporte.resumen.total_itbis)],
                    [tr('Monto Total:', 'Total Amount:'), parseFloat(datosReporte.resumen.monto_total)],
                    [tr('Promedio:', 'Average:'), parseFloat(datosReporte.resumen.promedio_venta)]
                ]

                const ws = XLSX.utils.aoa_to_sheet(wsData)
                ws['!cols'] = [{ wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]
                XLSX.utils.book_append_sheet(wb, ws, tr('Resumen', 'Summary'))
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
            case 'resumen': return 'stats-chart-outline'
            case 'ventas': return 'cart-outline'
            case 'productos': return 'cube-outline'
            case 'compras': return 'bag-handle-outline'
            case 'cxc': return 'cash-outline'
            case 'cxp': return 'receipt-outline'
            case 'gastos': return 'wallet-outline'
            case 'clientes': return 'people-outline'
            case 'inventario': return 'file-tray-stacked-outline'
            default: return 'document-outline'
        }
    }

    const obtenerTituloReporte = () => {
        switch(tipoReporte) {
            case 'resumen': return tr('Resumen de Ventas', 'Sales Summary')
            case 'ventas': return tr('Reporte de Ventas', 'Sales Report')
            case 'productos': return tr('Reporte de Productos', 'Products Report')
            case 'compras': return tr('Reporte de Compras', 'Purchases Report')
            case 'cxc': return tr('Cuentas por Cobrar', 'Accounts Receivable')
            case 'cxp': return tr('Cuentas por Pagar', 'Accounts Payable')
            case 'gastos': return tr('Reporte de Gastos', 'Expenses Report')
            case 'clientes': return tr('Reporte de Clientes', 'Customers Report')
            case 'inventario': return tr('Reporte de Inventario', 'Inventory Report')
            default: return tr('Reporte', 'Report')
        }
    }

    const opcionesReporte = [
        { id: 'resumen', icono: 'stats-chart-outline', titulo: tr('Resumen', 'Summary'), detalle: tr('Totales por día y mes', 'Totals by day and month') },
        { id: 'ventas', icono: 'cart-outline', titulo: tr('Ventas', 'Sales'), detalle: tr('Facturación y tickets', 'Billing and tickets') },
        { id: 'productos', icono: 'cube-outline', titulo: tr('Productos', 'Products'), detalle: tr('Rotación e ingresos', 'Turnover and revenue') },
        { id: 'compras', icono: 'bag-handle-outline', titulo: tr('Compras', 'Purchases'), detalle: tr('Costos y proveedores', 'Costs and suppliers') },
        { id: 'cxc', icono: 'cash-outline', titulo: tr('Cuentas por Cobrar', 'Accounts Receivable'), detalle: tr('Saldos y antigüedad', 'Balances and aging') },
        { id: 'cxp', icono: 'receipt-outline', titulo: tr('Cuentas por Pagar', 'Accounts Payable'), detalle: tr('Proveedores y vencimientos', 'Suppliers and aging') },
        { id: 'gastos', icono: 'wallet-outline', titulo: tr('Gastos', 'Expenses'), detalle: tr('Egresos del período', 'Period expenses') },
        { id: 'clientes', icono: 'people-outline', titulo: tr('Clientes', 'Customers'), detalle: tr('Actividad de compra', 'Purchase activity') },
        { id: 'inventario', icono: 'file-tray-stacked-outline', titulo: tr('Inventario', 'Inventory'), detalle: tr('Vencimientos y ubicación en bodega', 'Expiry dates and warehouse location') },
    ]

    const coincideBusqueda = (item) => {
        if (!busqueda.trim()) return true
        const q = busqueda.trim().toLowerCase()
        return Object.entries(item || {}).some(([k, v]) => {
            if (k === 'id' || k === 'compra_id' || k === 'proveedor_id') return false
            if (v === null || v === undefined || typeof v === 'object') return false
            return String(v).toLowerCase().includes(q)
        })
    }

    const datosTabla = (() => {
        if (!datosReporte) return { filas: [], total: 0, pagina: 0, totalPaginas: 1 }
        let arr = []
        switch (tipoReporte) {
            case 'resumen': arr = agrupacionResumen === 'dia' ? (datosReporte.porDia || []) : (datosReporte.porMes || []); break
            case 'ventas': arr = datosReporte.ventas || []; break
            case 'productos': arr = datosReporte.productos || []; break
            case 'compras': arr = datosReporte.compras || []; break
            case 'cxc':
            case 'cxp':
            case 'inventario': arr = datosReporte.detalle || []; break
            case 'gastos': arr = datosReporte.gastos || []; break
            case 'clientes': arr = datosReporte.clientes || []; break
            default: arr = []
        }
        const filtrado = arr.filter(coincideBusqueda)
        const totalPaginas = Math.max(1, Math.ceil(filtrado.length / CLIENTES_POR_PAGINA))
        const pagina = Math.min(paginaTabla, totalPaginas - 1)
        const filas = filtrado.slice(pagina * CLIENTES_POR_PAGINA, pagina * CLIENTES_POR_PAGINA + CLIENTES_POR_PAGINA)
        return { filas, total: filtrado.length, pagina, totalPaginas }
    })()
    const totalFilas = datosTabla.total

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <span className={estilos.eyebrow}>{tr('Centro de análisis', 'Analysis center')}</span>
                    <h1 className={estilos.titulo}>{tr('Reportes', 'Reports')}</h1>
                    <p className={estilos.subtitulo}>{tr('Genera y exporta reportes del negocio', 'Generate and export business reports')}</p>
                </div>
                <div className={estilos.headerState}>
                    <ion-icon name="calendar-outline"></ion-icon>
                    <span>{fechaInicio && fechaFin ? `${fechaInicio} - ${fechaFin}` : tr('Cargando período', 'Loading period')}</span>
                </div>
            </div>

            <section className={`${estilos.panel} ${estilos[tema]} ${estilos.panelControl}`}>
                <div className={estilos.controlHeading}>
                    <div>
                        <span className={estilos.sectionKicker}>{tr('Preparar consulta', 'Prepare query')}</span>
                        <h2 className={estilos.panelTitulo}>{tr('Configurar Reporte', 'Configure Report')}</h2>
                    </div>
                    <span className={estilos.controlHint}>{tr('Elige un enfoque y período', 'Choose a focus and period')}</span>
                </div>

                <div className={estilos.reportTypeGrid} role="group" aria-label={tr('Tipo de Reporte', 'Report Type')}>
                    {opcionesReporte.map((opcion) => (
                        <button
                            key={opcion.id}
                            type="button"
                            className={`${estilos.reportType} ${tipoReporte === opcion.id ? estilos.reportTypeActivo : ''}`}
                            onClick={() => { setTipoReporte(opcion.id); setDatosReporte(null); setPaginaClientes(0); setPaginaTabla(0); setBusqueda('') }}
                            disabled={cargando || procesando}
                        >
                            <span className={estilos.reportTypeIcon}><ion-icon name={opcion.icono}></ion-icon></span>
                            <span><strong>{opcion.titulo}</strong><small>{opcion.detalle}</small></span>
                        </button>
                    ))}
                </div>

                <div className={estilos.controlBar}>
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
            </section>

            {datosReporte && (
                <section className={`${estilos.panel} ${estilos[tema]} ${estilos.resultadosPanel}`}>
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
                        <span className={estilos.filasBadge}>{totalFilas} {tr('registros', 'records')}</span>
                    </div>

                    <div className={estilos.resumenGrid}>
                        {tipoReporte === 'resumen' && (
                            <>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>{tr('Total Ventas', 'Total Sales')}</span>
                                    <span className={estilos.resumenValor}>{datosReporte.resumen.total_ventas}</span>
                                </div>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>{tr('Subtotal', 'Subtotal')}</span>
                                    <span className={estilos.resumenValor}>{formatearMoneda(datosReporte.resumen.total_subtotal)}</span>
                                </div>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>ITBIS</span>
                                    <span className={estilos.resumenValor}>{formatearMoneda(datosReporte.resumen.total_itbis)}</span>
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

                        {tipoReporte === 'compras' && (
                            <>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>{tr('Total Compras', 'Total Purchases')}</span>
                                    <span className={estilos.resumenValor}>{datosReporte.resumen.total_compras}</span>
                                </div>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>{tr('Subtotal Bruto', 'Gross Subtotal')}</span>
                                    <span className={estilos.resumenValor}>{formatearMoneda(datosReporte.resumen.subtotal)}</span>
                                </div>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>ITBIS</span>
                                    <span className={estilos.resumenValor}>{formatearMoneda(datosReporte.resumen.itbis)}</span>
                                </div>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>{tr('Total', 'Total')}</span>
                                    <span className={estilos.resumenValor}>{formatearMoneda(datosReporte.resumen.total)}</span>
                                </div>
                            </>
                        )}

                        {tipoReporte === 'cxc' && (
                            <>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>{tr('Cuentas Activas', 'Active Accounts')}</span>
                                    <span className={estilos.resumenValor}>{datosReporte.detalle.length}</span>
                                </div>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>{tr('Saldo Pendiente', 'Outstanding Balance')}</span>
                                    <span className={estilos.resumenValor}>{formatearMoneda(datosReporte.detalle.reduce((total, cuenta) => total + parseFloat(cuenta.saldo_pendiente || 0), 0))}</span>
                                </div>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>{tr('Cuentas Vencidas', 'Overdue Accounts')}</span>
                                    <span className={estilos.resumenValor}>{datosReporte.detalle.filter(cuenta => cuenta.estado_cxc === 'vencida').length}</span>
                                </div>
                            </>
                        )}

                        {tipoReporte === 'cxp' && (
                            <>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>{tr('Total Cuentas', 'Total Accounts')}</span>
                                    <span className={estilos.resumenValor}>{datosReporte.resumen.total_cuentas}</span>
                                </div>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>{tr('Saldo Total', 'Total Balance')}</span>
                                    <span className={estilos.resumenValor}>{formatearMoneda(datosReporte.resumen.saldo_total)}</span>
                                </div>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>{tr('Saldo Vencido', 'Overdue Balance')}</span>
                                    <span className={estilos.resumenValor}>{formatearMoneda(datosReporte.resumen.saldo_vencido || 0)}</span>
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

                        {tipoReporte === 'inventario' && (
                            <>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>{tr('Vencidos', 'Expired')}</span>
                                    <span className={estilos.resumenValor}>{datosReporte.resumen.vencidos}</span>
                                </div>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>{tr('Por Vencer (30 dias)', 'Expiring Soon (30 days)')}</span>
                                    <span className={estilos.resumenValor}>{datosReporte.resumen.por_vencer}</span>
                                </div>
                                <div className={estilos.resumenCard}>
                                    <span className={estilos.resumenLabel}>{tr('Con Ubicacion Asignada', 'With Location Assigned')}</span>
                                    <span className={estilos.resumenValor}>{datosReporte.resumen.con_ubicacion}</span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className={estilos.tableHeader}>
                        <h3>{tipoReporte === 'resumen' ? tr('Resumen por período', 'Summary by period') : tr('Detalle del período', 'Period detail')}</h3>
                        <div className={estilos.tableHeaderAcciones}>
                            {tipoReporte === 'resumen' && (
                                <div className={estilos.grupoDoble}>
                                    <button
                                        type="button"
                                        className={agrupacionResumen === 'dia' ? estilos.btnGenerar : estilos.btnExportar}
                                        onClick={() => { setAgrupacionResumen('dia'); setPaginaTabla(0) }}
                                    >
                                        {tr('Por día', 'By day')}
                                    </button>
                                    <button
                                        type="button"
                                        className={agrupacionResumen === 'mes' ? estilos.btnGenerar : estilos.btnExportar}
                                        onClick={() => { setAgrupacionResumen('mes'); setPaginaTabla(0) }}
                                    >
                                        {tr('Por mes', 'By month')}
                                    </button>
                                </div>
                            )}
                            <div className={estilos.buscadorTabla}>
                                <ion-icon name="search-outline"></ion-icon>
                                <input
                                    type="text"
                                    value={busqueda}
                                    onChange={(e) => { setBusqueda(e.target.value); setPaginaTabla(0) }}
                                    placeholder={tr('Buscar en el reporte...', 'Search report...')}
                                />
                            </div>
                        </div>
                    </div>
                    <div className={estilos.tablaContainer}>
                        <table className={estilos.tabla}>
                            <thead>
                                {tipoReporte === 'resumen' && (
                                    <tr>
                                        <th>{agrupacionResumen === 'dia' ? tr('Fecha', 'Date') : tr('Mes', 'Month')}</th>
                                        <th>{tr('Cantidad', 'Count')}</th>
                                        <th>{tr('Subtotal', 'Subtotal')}</th>
                                        <th>ITBIS</th>
                                        <th>{tr('Total', 'Total')}</th>
                                        <th>{tr('Efectivo', 'Cash')}</th>
                                        <th>{tr('Crédito', 'Credit')}</th>
                                    </tr>
                                )}
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
                                        <th>{tr('Costo Total', 'Total Cost')}</th>
                                        <th>{tr('Beneficio', 'Profit')}</th>
                                    </tr>
                                )}
                                {tipoReporte === 'compras' && (
                                    <tr>
                                        <th>{tr('Fecha', 'Date')}</th>
                                        <th>NCF</th>
                                        <th>{tr('Proveedor', 'Supplier')}</th>
                                        <th>{tr('Subtotal', 'Subtotal')}</th>
                                        <th>ITBIS</th>
                                        <th>{tr('Total', 'Total')}</th>
                                        <th>{tr('Método', 'Method')}</th>
                                    </tr>
                                )}
                                {tipoReporte === 'cxc' && (
                                    <tr>
                                        <th>{tr('Cliente', 'Customer')}</th>
                                        <th>{tr('Documento', 'Document')}</th>
                                        <th>NCF</th>
                                        <th>{tr('Monto Total', 'Total Amount')}</th>
                                        <th>{tr('Saldo', 'Balance')}</th>
                                        <th>{tr('Vencimiento', 'Due Date')}</th>
                                        <th>{tr('Días Atraso', 'Days Late')}</th>
                                        <th>{tr('Antigüedad', 'Aging')}</th>
                                    </tr>
                                )}
                                {tipoReporte === 'cxp' && (
                                    <tr>
                                        <th>{tr('Proveedor', 'Supplier')}</th>
                                        <th>RNC</th>
                                        <th>NCF</th>
                                        <th>{tr('Fecha', 'Date')}</th>
                                        <th>{tr('Total', 'Total')}</th>
                                        <th>{tr('Pagado', 'Paid')}</th>
                                        <th>{tr('Saldo', 'Balance')}</th>
                                        <th>{tr('Vencimiento', 'Due Date')}</th>
                                        <th>{tr('Días', 'Days')}</th>
                                        <th>{tr('Estado', 'Status')}</th>
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
                                {tipoReporte === 'inventario' && (
                                    <tr>
                                        <th>{tr('Producto', 'Product')}</th>
                                        <th>SKU</th>
                                        <th>{tr('Categoria', 'Category')}</th>
                                        <th>Stock</th>
                                        <th>{tr('Vencimiento', 'Expiry')}</th>
                                        <th>{tr('Dias', 'Days')}</th>
                                        <th>{tr('Lote', 'Batch')}</th>
                                        <th>{tr('Ubicacion', 'Location')}</th>
                                        <th>{tr('Estado', 'Status')}</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody>
                                {tipoReporte === 'resumen' && datosTabla.filas.map((fila, index) => (
                                    <tr key={index}>
                                        <td>{fila.periodo}</td>
                                        <td>{fila.cantidad}</td>
                                        <td>{formatearMoneda(fila.subtotal)}</td>
                                        <td>{formatearMoneda(fila.itbis)}</td>
                                        <td><strong>{formatearMoneda(fila.total)}</strong></td>
                                        <td>{formatearMoneda(fila.efectivo)}</td>
                                        <td>{formatearMoneda(fila.credito)}</td>
                                    </tr>
                                ))}

                                {tipoReporte === 'ventas' && datosTabla.filas.map((venta, index) => (
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

                                {tipoReporte === 'productos' && datosTabla.filas.map((producto, index) => (
                                    <tr key={index}>
                                        <td>{producto.nombre}</td>
                                        <td>{producto.categoria_nombre || tr('Sin categoria', 'No category')}</td>
                                        <td>{producto.stock}</td>
                                        <td>{producto.cantidad_vendida}</td>
                                        <td>{formatearMoneda(producto.ingresos_generados)}</td>
                                        <td>{formatearMoneda(producto.costo_total)}</td>
                                        <td>{formatearMoneda(producto.beneficio)}</td>
                                    </tr>
                                ))}

                                {tipoReporte === 'compras' && datosTabla.filas.map((compra, index) => (
                                    <tr key={index}>
                                        <td>{new Date(compra.fecha_compra).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO')}</td>
                                        <td>{compra.ncf || 'N/A'}</td>
                                        <td>{compra.proveedor_nombre}</td>
                                        <td>{formatearMoneda(compra.subtotal)}</td>
                                        <td>{formatearMoneda(compra.itbis)}</td>
                                        <td>{formatearMoneda(compra.total)}</td>
                                        <td>{compra.metodo_pago}</td>
                                    </tr>
                                ))}

                                {tipoReporte === 'cxc' && datosTabla.filas.map((cuenta, index) => (
                                    <tr key={index}>
                                        <td>{`${cuenta.nombre} ${cuenta.apellidos || ''}`.trim()}</td>
                                        <td>{cuenta.cliente_documento || 'N/A'}</td>
                                        <td>{cuenta.ncf || 'N/A'}</td>
                                        <td>{formatearMoneda(cuenta.monto_total)}</td>
                                        <td>{formatearMoneda(cuenta.saldo_pendiente)}</td>
                                        <td>{cuenta.fecha_vencimiento ? formatearFecha(cuenta.fecha_vencimiento) : 'N/A'}</td>
                                        <td>{cuenta.dias_atraso || 0}</td>
                                        <td>{cuenta.rango_antiguedad}</td>
                                    </tr>
                                ))}

                                {tipoReporte === 'cxp' && datosTabla.filas.map((cuenta, index) => (
                                    <tr key={index}>
                                        <td>{cuenta.proveedor_nombre}</td>
                                        <td>{cuenta.proveedor_rnc || 'N/A'}</td>
                                        <td>{cuenta.ncf || 'N/A'}</td>
                                        <td>{cuenta.fecha_emision ? new Date(cuenta.fecha_emision).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO') : 'N/A'}</td>
                                        <td>{formatearMoneda(cuenta.monto_total)}</td>
                                        <td>{formatearMoneda(cuenta.monto_pagado)}</td>
                                        <td><strong>{formatearMoneda(cuenta.saldo_pendiente)}</strong></td>
                                        <td>{cuenta.fecha_vencimiento ? formatearFecha(cuenta.fecha_vencimiento) : 'N/A'}</td>
                                        <td>{cuenta.dias_documento}</td>
                                        <td>{cuenta.estado}</td>
                                    </tr>
                                ))}

                                {tipoReporte === 'gastos' && datosTabla.filas.map((gasto, index) => (
                                    <tr key={index}>
                                        <td>{new Date(gasto.fecha_gasto).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO')}</td>
                                        <td>{gasto.concepto}</td>
                                        <td>{gasto.categoria || tr('Sin categoria', 'No category')}</td>
                                        <td>{formatearMoneda(gasto.monto)}</td>
                                        <td>{gasto.usuario_nombre}</td>
                                    </tr>
                                ))}

                                {tipoReporte === 'clientes' && datosTabla.filas.map((cliente, index) => (
                                    <tr key={index}>
                                        <td>{cliente.nombre} {cliente.apellidos}</td>
                                        <td>{cliente.numero_documento}</td>
                                        <td>{cliente.telefono || 'N/A'}</td>
                                        <td>{formatearMoneda(cliente.total_compras)}</td>
                                        <td>{cliente.ultima_compra ? new Date(cliente.ultima_compra).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO') : 'N/A'}</td>
                                    </tr>
                                ))}

                                {tipoReporte === 'inventario' && datosTabla.filas.map((producto, index) => (
                                    <tr key={index}>
                                        <td>{producto.nombre}</td>
                                        <td>{producto.sku || 'N/A'}</td>
                                        <td>{producto.categoria_nombre}</td>
                                        <td>{producto.stock}</td>
                                        <td>{producto.fecha_vencimiento ? formatearFecha(producto.fecha_vencimiento) : 'N/A'}</td>
                                        <td>{producto.dias_para_vencer ?? 'N/A'}</td>
                                        <td>{producto.lote || 'N/A'}</td>
                                        <td>{producto.ubicacion_bodega || 'N/A'}</td>
                                        <td>{producto.estado_vencimiento}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {datosTabla.total > CLIENTES_POR_PAGINA && (
                        <nav className={estilos.paginacion} aria-label={tr('Paginación del reporte', 'Report pagination')}>
                            <span className={estilos.paginacionResumen}>
                                {tr('Mostrando', 'Showing')} {datosTabla.pagina * CLIENTES_POR_PAGINA + 1}-{Math.min((datosTabla.pagina + 1) * CLIENTES_POR_PAGINA, datosTabla.total)} {tr('de', 'of')} {datosTabla.total}
                            </span>
                            <div className={estilos.paginacionControles}>
                                <button
                                    type="button"
                                    className={estilos.btnPagina}
                                    onClick={() => setPaginaTabla(p => Math.max(0, p - 1))}
                                    disabled={datosTabla.pagina === 0}
                                    aria-label={tr('Página anterior', 'Previous page')}
                                >
                                    <ion-icon name="chevron-back-outline"></ion-icon>
                                </button>
                                <span className={estilos.paginaActual}>{datosTabla.pagina + 1} / {datosTabla.totalPaginas}</span>
                                <button
                                    type="button"
                                    className={estilos.btnPagina}
                                    onClick={() => setPaginaTabla(p => Math.min(datosTabla.totalPaginas - 1, p + 1))}
                                    disabled={datosTabla.pagina >= datosTabla.totalPaginas - 1}
                                    aria-label={tr('Página siguiente', 'Next page')}
                                >
                                    <ion-icon name="chevron-forward-outline"></ion-icon>
                                </button>
                            </div>
                        </nav>
                    )}
                </section>
            )}
        </div>
    )
}