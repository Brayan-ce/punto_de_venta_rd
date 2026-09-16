"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerReporteVentas(fechaInicio, fechaFin) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [ventas] = await connection.execute(
            `SELECT 
                v.id,
                v.ncf,
                v.fecha_venta,
                v.subtotal,
                v.itbis,
                v.total,
                v.metodo_pago,
                COALESCE(c.nombre, 'Consumidor Final') as cliente_nombre,
                u.nombre as usuario_nombre
            FROM ventas v
            LEFT JOIN clientes c ON v.cliente_id = c.id
            INNER JOIN usuarios u ON v.usuario_id = u.id
            WHERE v.empresa_id = ?
            AND DATE(v.fecha_venta) BETWEEN ? AND ?
            AND v.estado = 'emitida'
            ORDER BY v.fecha_venta DESC`,
            [empresaId, fechaInicio, fechaFin]
        )

        const [resumen] = await connection.execute(
            `SELECT 
                COUNT(*) as total_ventas,
                COALESCE(SUM(total), 0) as monto_total,
                COALESCE(AVG(total), 0) as promedio_venta
            FROM ventas
            WHERE empresa_id = ?
            AND DATE(fecha_venta) BETWEEN ? AND ?
            AND estado = 'emitida'`,
            [empresaId, fechaInicio, fechaFin]
        )

        connection.release()

        return {
            success: true,
            datos: {
                ventas: ventas,
                resumen: resumen[0]
            }
        }

    } catch (error) {
        console.error('Error al generar reporte de ventas:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al generar el reporte'
        }
    }
}

export async function obtenerReporteProductos(fechaInicio, fechaFin) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [productos] = await connection.execute(
            `SELECT 
                p.id,
                p.nombre,
                p.codigo_barras,
                p.sku,
                p.stock,
                p.precio_compra,
                COALESCE(c.nombre, 'Sin categoria') as categoria_nombre,
                COALESCE(SUM(dv.cantidad), 0) as cantidad_vendida,
                COALESCE(SUM(dv.total), 0) as ingresos_generados,
                COALESCE(SUM(dv.cantidad * p.precio_compra), 0) as costo_total,
                COALESCE(SUM(dv.total - (dv.cantidad * p.precio_compra)), 0) as beneficio
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            LEFT JOIN detalle_ventas dv ON p.id = dv.producto_id
            LEFT JOIN ventas v ON dv.venta_id = v.id
            WHERE p.empresa_id = ?
                AND (dv.id IS NULL OR (DATE(v.fecha_venta) BETWEEN ? AND ? AND v.estado = 'emitida'))
            GROUP BY p.id
            ORDER BY cantidad_vendida DESC`,
            [empresaId, fechaInicio, fechaFin]
        )

        const [resumen] = await connection.execute(
            `SELECT 
                COUNT(DISTINCT p.id) as total_productos,
                COUNT(DISTINCT CASE WHEN dv.id IS NOT NULL THEN p.id END) as productos_vendidos,
                COALESCE(SUM(dv.cantidad), 0) as unidades_vendidas,
                COALESCE(SUM(dv.total), 0) as ingresos_totales
            FROM productos p
            LEFT JOIN detalle_ventas dv ON p.id = dv.producto_id
            LEFT JOIN ventas v ON dv.venta_id = v.id
            WHERE p.empresa_id = ?
                AND (dv.id IS NULL OR (DATE(v.fecha_venta) BETWEEN ? AND ? AND v.estado = 'emitida'))`,
            [empresaId, fechaInicio, fechaFin]
        )

        connection.release()

        return {
            success: true,
            datos: {
                productos: productos,
                resumen: resumen[0]
            }
        }

    } catch (error) {
        console.error('Error al generar reporte de productos:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al generar el reporte'
        }
    }
}

export async function obtenerReporteCompras(fechaInicio, fechaFin) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        if (!userId || !empresaId) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()
        const [compras] = await connection.execute(
            `SELECT c.id, c.fecha_compra, c.ncf, c.subtotal, c.itbis, c.total,
                    COALESCE(p.razon_social, p.nombre_comercial, 'Sin proveedor') proveedor_nombre,
                    c.metodo_pago
             FROM compras c
             LEFT JOIN proveedores p ON p.id = c.proveedor_id
             WHERE c.empresa_id = ? AND DATE(c.fecha_compra) BETWEEN ? AND ?
               AND c.estado <> 'anulada'
             ORDER BY c.fecha_compra DESC`,
            [empresaId, fechaInicio, fechaFin]
        )
        const [detalle] = await connection.execute(
            `SELECT p.nombre, p.codigo_barras, p.sku,
                    SUM(dc.cantidad) cantidad_comprada,
                    SUM(dc.subtotal) costo_total,
                    CASE WHEN SUM(dc.cantidad) = 0 THEN 0 ELSE SUM(dc.subtotal) / SUM(dc.cantidad) END costo_promedio
             FROM detalle_compras dc
             INNER JOIN compras c ON c.id = dc.compra_id
             INNER JOIN productos p ON p.id = dc.producto_id
             WHERE c.empresa_id = ? AND DATE(c.fecha_compra) BETWEEN ? AND ?
               AND c.estado <> 'anulada'
             GROUP BY p.id, p.nombre, p.codigo_barras, p.sku
             ORDER BY costo_total DESC`,
            [empresaId, fechaInicio, fechaFin]
        )
        const [resumen] = await connection.execute(
            `SELECT COUNT(*) total_compras, COALESCE(SUM(subtotal), 0) subtotal,
                    COALESCE(SUM(itbis), 0) itbis, COALESCE(SUM(total), 0) total
             FROM compras WHERE empresa_id = ? AND DATE(fecha_compra) BETWEEN ? AND ?
               AND estado <> 'anulada'`,
            [empresaId, fechaInicio, fechaFin]
        )
        connection.release()
        return { success: true, datos: { compras, detalle, resumen: resumen[0] } }
    } catch (error) {
        console.error('Error al generar reporte de compras:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al generar el reporte de compras' }
    }
}

export async function obtenerReporteCuentasPorCobrar() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        if (!userId || !empresaId) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()
        const [resumen] = await connection.execute(
            `SELECT rango_antiguedad, COUNT(*) cantidad_cuentas,
                    COALESCE(SUM(saldo_pendiente), 0) monto_pendiente,
                    COALESCE(AVG(dias_atraso), 0) dias_promedio,
                    COALESCE(SUM(CASE WHEN estado_cxc = 'vencida' THEN saldo_pendiente ELSE 0 END), 0) monto_vencido
             FROM cuentas_por_cobrar
             WHERE empresa_id = ? AND estado_cxc IN ('activa', 'vencida', 'parcial')
             GROUP BY rango_antiguedad
             ORDER BY FIELD(rango_antiguedad, 'corriente', '1-7_dias', '8-15_dias', '16-30_dias', 'mas_30_dias')`,
            [empresaId]
        )
        const [detalle] = await connection.execute(
            `SELECT c.nombre, c.apellidos, c.numero_documento cliente_documento,
                    cxc.numero_documento ncf, cxc.monto_total, cxc.monto_pagado,
                    cxc.saldo_pendiente, cxc.fecha_emision, cxc.fecha_vencimiento,
                    cxc.dias_atraso, cxc.rango_antiguedad, cxc.estado_cxc,
                    COUNT(ac.id) num_abonos, MAX(ac.fecha_abono) ultimo_abono
             FROM cuentas_por_cobrar cxc
             INNER JOIN clientes c ON c.id = cxc.cliente_id
             LEFT JOIN abonos_credito ac ON ac.cxc_id = cxc.id
             WHERE cxc.empresa_id = ? AND cxc.estado_cxc IN ('activa', 'vencida', 'parcial')
             GROUP BY cxc.id, c.id
             ORDER BY cxc.dias_atraso DESC, cxc.fecha_vencimiento ASC`,
            [empresaId]
        )
        connection.release()
        return { success: true, datos: { resumen, detalle } }
    } catch (error) {
        console.error('Error al generar reporte de cuentas por cobrar:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al generar el reporte de cuentas por cobrar' }
    }
}

export async function obtenerReporteCuentasPorPagar() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        if (!userId || !empresaId) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()
        const [detalle] = await connection.execute(
            `SELECT cxp.id AS id,
                    c.ncf,
                    c.fecha_compra,
                    cxp.fecha_emision,
                    cxp.fecha_vencimiento,
                    cxp.monto_total,
                    cxp.monto_pagado,
                    cxp.saldo_pendiente,
                    DATEDIFF(CURRENT_DATE(), cxp.fecha_emision) dias_documento,
                    COALESCE(NULLIF(p.razon_social, ''), NULLIF(p.nombre_comercial, ''), 'Sin proveedor') proveedor_nombre,
                    p.rnc proveedor_rnc,
                    cxp.estado
             FROM cuentas_por_pagar cxp
             INNER JOIN compras c ON c.id = cxp.compra_id
             LEFT JOIN proveedores p ON p.id = cxp.proveedor_id
             WHERE cxp.empresa_id = ?
               AND cxp.estado IN ('pendiente', 'parcial')
               AND cxp.saldo_pendiente > 0
             ORDER BY cxp.fecha_emision ASC`,
            [empresaId]
        )
        const [resumen] = await connection.execute(
            `SELECT COUNT(*) total_cuentas,
                    COALESCE(SUM(saldo_pendiente), 0) saldo_total,
                    COALESCE(SUM(CASE WHEN fecha_vencimiento IS NOT NULL AND fecha_vencimiento < CURRENT_DATE() THEN saldo_pendiente ELSE 0 END), 0) saldo_vencido
             FROM cuentas_por_pagar
             WHERE empresa_id = ?
               AND estado IN ('pendiente', 'parcial')
               AND saldo_pendiente > 0`,
            [empresaId]
        )
        connection.release()
        return { success: true, datos: { detalle, resumen: resumen[0] } }
    } catch (error) {
        console.error('Error al generar reporte de cuentas por pagar:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al generar el reporte de cuentas por pagar' }
    }
}

export async function obtenerReporteInventario() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        if (!userId || !empresaId) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()
        const [detalle] = await connection.execute(
            `SELECT p.id, p.nombre, p.codigo_barras, p.sku, p.stock,
                    p.fecha_vencimiento, p.lote, p.ubicacion_bodega,
                    COALESCE(c.nombre, 'Sin categoria') categoria_nombre,
                    DATEDIFF(p.fecha_vencimiento, CURDATE()) dias_para_vencer,
                    CASE
                        WHEN p.fecha_vencimiento IS NULL THEN 'sin_fecha'
                        WHEN p.fecha_vencimiento < CURDATE() THEN 'vencido'
                        WHEN p.fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'por_vencer'
                        ELSE 'vigente'
                    END estado_vencimiento
             FROM productos p
             LEFT JOIN categorias c ON p.categoria_id = c.id
             WHERE p.empresa_id = ? AND p.activo = TRUE
               AND (p.fecha_vencimiento IS NOT NULL OR p.ubicacion_bodega IS NOT NULL)
             ORDER BY (p.fecha_vencimiento IS NULL), p.fecha_vencimiento ASC`,
            [empresaId]
        )
        const [porBodega] = await connection.execute(
            `SELECT COALESCE(p.ubicacion_bodega, 'Sin ubicacion') ubicacion_bodega,
                    COUNT(*) cantidad_productos, COALESCE(SUM(p.stock), 0) stock_total
             FROM productos p
             WHERE p.empresa_id = ? AND p.activo = TRUE
             GROUP BY COALESCE(p.ubicacion_bodega, 'Sin ubicacion')
             ORDER BY cantidad_productos DESC`,
            [empresaId]
        )
        const [resumen] = await connection.execute(
            `SELECT
                COUNT(CASE WHEN fecha_vencimiento IS NOT NULL AND fecha_vencimiento < CURDATE() THEN 1 END) vencidos,
                COUNT(CASE WHEN fecha_vencimiento IS NOT NULL AND fecha_vencimiento >= CURDATE() AND fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 END) por_vencer,
                COUNT(CASE WHEN ubicacion_bodega IS NOT NULL AND ubicacion_bodega <> '' THEN 1 END) con_ubicacion
             FROM productos
             WHERE empresa_id = ? AND activo = TRUE`,
            [empresaId]
        )
        connection.release()
        return { success: true, datos: { detalle, porBodega, resumen: resumen[0] } }
    } catch (error) {
        console.error('Error al generar reporte de inventario:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al generar el reporte de inventario' }
    }
}

export async function obtenerReporteGastos(fechaInicio, fechaFin) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [gastos] = await connection.execute(
            `SELECT 
                g.id,
                g.concepto,
                g.monto,
                g.categoria,
                g.comprobante_numero,
                g.fecha_gasto,
                u.nombre as usuario_nombre
            FROM gastos g
            INNER JOIN usuarios u ON g.usuario_id = u.id
            WHERE g.empresa_id = ?
            AND DATE(g.fecha_gasto) BETWEEN ? AND ?
            ORDER BY g.fecha_gasto DESC`,
            [empresaId, fechaInicio, fechaFin]
        )

        const [resumen] = await connection.execute(
            `SELECT 
                COUNT(*) as total_gastos,
                COALESCE(SUM(monto), 0) as monto_total,
                COALESCE(AVG(monto), 0) as promedio_gasto
            FROM gastos
            WHERE empresa_id = ?
            AND DATE(fecha_gasto) BETWEEN ? AND ?`,
            [empresaId, fechaInicio, fechaFin]
        )

        connection.release()

        return {
            success: true,
            datos: {
                gastos: gastos,
                resumen: resumen[0]
            }
        }

    } catch (error) {
        console.error('Error al generar reporte de gastos:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al generar el reporte'
        }
    }
}

export async function obtenerReporteClientes(fechaInicio, fechaFin) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [clientes] = await connection.execute(
            `SELECT 
                c.id,
                c.nombre,
                c.apellidos,
                c.numero_documento,
                c.telefono,
                c.total_compras,
                MAX(v.fecha_venta) as ultima_compra
            FROM clientes c
            LEFT JOIN ventas v ON c.id = v.cliente_id 
                AND DATE(v.fecha_venta) BETWEEN ? AND ?
                AND v.estado = 'emitida'
            WHERE c.empresa_id = ?
            GROUP BY c.id
            ORDER BY c.total_compras DESC`,
            [fechaInicio, fechaFin, empresaId]
        )

        const [resumen] = await connection.execute(
            `SELECT 
                COUNT(*) as total_clientes,
                COUNT(CASE WHEN activo = TRUE THEN 1 END) as clientes_activos,
                COALESCE(SUM(total_compras), 0) as compras_totales
            FROM clientes
            WHERE empresa_id = ?`,
            [empresaId]
        )

        connection.release()

        return {
            success: true,
            datos: {
                clientes: clientes,
                resumen: resumen[0]
            }
        }

    } catch (error) {
        console.error('Error al generar reporte de clientes:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al generar el reporte'
        }
    }
}

export async function obtenerDatosEmpresa() {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesion invalida' }
        }

        connection = await db.getConnection()

        const [rows] = await connection.execute(
            `SELECT moneda, simbolo_moneda, locale, impuesto_nombre, impuesto_porcentaje
             FROM empresas
             WHERE id = ?`,
            [empresaId]
        )

        connection.release()

        if (rows.length === 0) {
            return { success: false, mensaje: 'Empresa no encontrada' }
        }

        return {
            success: true,
            empresa: rows[0]
        }
    } catch (error) {
        console.error('Error al obtener datos empresa:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al obtener datos empresa' }
    }
}

export async function obtenerReporteResumen(fechaInicio, fechaFin) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        if (!userId || !empresaId) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()

        const [porDia] = await connection.execute(
            `SELECT DATE_FORMAT(v.fecha_venta, '%Y-%m-%d') periodo,
                    COUNT(*) cantidad,
                    COALESCE(SUM(v.subtotal), 0) subtotal,
                    COALESCE(SUM(v.itbis), 0) itbis,
                    COALESCE(SUM(v.total), 0) total,
                    COALESCE(SUM(CASE WHEN v.metodo_pago = 'efectivo' THEN v.total ELSE 0 END), 0) efectivo,
                    COALESCE(SUM(CASE WHEN v.metodo_pago = 'credito' THEN v.total ELSE 0 END), 0) credito
             FROM ventas v
             WHERE v.empresa_id = ?
               AND DATE(v.fecha_venta) BETWEEN ? AND ?
               AND v.estado = 'emitida'
             GROUP BY periodo
             ORDER BY periodo DESC`,
            [empresaId, fechaInicio, fechaFin]
        )

        const [porMes] = await connection.execute(
            `SELECT DATE_FORMAT(v.fecha_venta, '%Y-%m') periodo,
                    COUNT(*) cantidad,
                    COALESCE(SUM(v.subtotal), 0) subtotal,
                    COALESCE(SUM(v.itbis), 0) itbis,
                    COALESCE(SUM(v.total), 0) total,
                    COALESCE(SUM(CASE WHEN v.metodo_pago = 'efectivo' THEN v.total ELSE 0 END), 0) efectivo,
                    COALESCE(SUM(CASE WHEN v.metodo_pago = 'credito' THEN v.total ELSE 0 END), 0) credito
             FROM ventas v
             WHERE v.empresa_id = ?
               AND DATE(v.fecha_venta) BETWEEN ? AND ?
               AND v.estado = 'emitida'
             GROUP BY periodo
             ORDER BY periodo DESC`,
            [empresaId, fechaInicio, fechaFin]
        )

        const [resumen] = await connection.execute(
            `SELECT COUNT(*) total_ventas,
                    COALESCE(SUM(total), 0) monto_total,
                    COALESCE(SUM(itbis), 0) total_itbis,
                    COALESCE(SUM(subtotal), 0) total_subtotal,
                    COALESCE(AVG(total), 0) promedio_venta
             FROM ventas
             WHERE empresa_id = ?
               AND DATE(fecha_venta) BETWEEN ? AND ?
               AND estado = 'emitida'`,
            [empresaId, fechaInicio, fechaFin]
        )

        connection.release()

        return {
            success: true,
            datos: {
                porDia,
                porMes,
                resumen: resumen[0]
            }
        }
    } catch (error) {
        console.error('Error al generar reporte resumen:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al generar el reporte resumen' }
    }
}