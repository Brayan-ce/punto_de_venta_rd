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
                COALESCE(c.nombre, 'Sin categoria') as categoria_nombre,
                COALESCE(SUM(dv.cantidad), 0) as cantidad_vendida,
                COALESCE(SUM(dv.total), 0) as ingresos_generados
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            LEFT JOIN detalle_ventas dv ON p.id = dv.producto_id
            LEFT JOIN ventas v ON dv.venta_id = v.id 
                AND DATE(v.fecha_venta) BETWEEN ? AND ?
                AND v.estado = 'emitida'
            WHERE p.empresa_id = ?
            GROUP BY p.id
            ORDER BY cantidad_vendida DESC`,
            [fechaInicio, fechaFin, empresaId]
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
                AND DATE(v.fecha_venta) BETWEEN ? AND ?
                AND v.estado = 'emitida'
            WHERE p.empresa_id = ?`,
            [fechaInicio, fechaFin, empresaId]
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