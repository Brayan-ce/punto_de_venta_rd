"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerVentaDespacho(ventaId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [venta] = await connection.execute(
            `SELECT 
                v.id,
                v.ncf,
                v.numero_interno,
                v.cliente_id,
                v.total,
                v.tipo_entrega,
                v.despacho_completo,
                v.estado,
                c.nombre as cliente_nombre
            FROM ventas v
            LEFT JOIN clientes c ON v.cliente_id = c.id
            WHERE v.id = ? AND v.empresa_id = ?`,
            [ventaId, empresaId]
        )

        if (venta.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Venta no encontrada'
            }
        }

        if (venta[0].tipo_entrega !== 'parcial') {
            connection.release()
            return {
                success: false,
                mensaje: 'Esta venta no tiene despachos parciales'
            }
        }

        if (venta[0].despacho_completo) {
            connection.release()
            return {
                success: false,
                mensaje: 'Esta venta ya fue despachada completamente'
            }
        }

        if (venta[0].estado !== 'emitida') {
            connection.release()
            return {
                success: false,
                mensaje: 'Solo se pueden despachar ventas emitidas'
            }
        }

        const [productos] = await connection.execute(
            `SELECT 
                dv.id,
                dv.producto_id,
                dv.cantidad,
                dv.cantidad_despachada,
                dv.cantidad_pendiente,
                dv.precio_unitario,
                p.nombre as nombre_producto,
                p.stock as stock_disponible
            FROM detalle_ventas dv
            INNER JOIN productos p ON dv.producto_id = p.id
            WHERE dv.venta_id = ? AND dv.cantidad_pendiente > 0
            ORDER BY dv.id ASC`,
            [ventaId]
        )

        connection.release()

        return {
            success: true,
            venta: venta[0],
            productos: productos
        }

    } catch (error) {
        console.error('Error al obtener venta para despacho:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar datos de la venta'
        }
    }
}

export async function obtenerHistorialDespachos(ventaId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [venta] = await connection.execute(
            `SELECT id, empresa_id FROM ventas WHERE id = ? AND empresa_id = ?`,
            [ventaId, empresaId]
        )

        if (venta.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Venta no encontrada'
            }
        }

        const [despachos] = await connection.execute(
            `SELECT 
                d.id,
                d.numero_despacho,
                d.fecha_despacho,
                d.observaciones,
                d.estado,
                u.nombre as usuario_nombre
            FROM despachos d
            INNER JOIN usuarios u ON d.usuario_id = u.id
            WHERE d.venta_id = ?
            ORDER BY d.numero_despacho DESC`,
            [ventaId]
        )

        const despachosConProductos = []

        for (const despacho of despachos) {
            const [productos] = await connection.execute(
                `SELECT 
                    dd.id,
                    dd.cantidad_despachada,
                    p.nombre as nombre_producto
                FROM detalle_despachos dd
                INNER JOIN detalle_ventas dv ON dd.detalle_venta_id = dv.id
                INNER JOIN productos p ON dv.producto_id = p.id
                WHERE dd.despacho_id = ?
                ORDER BY p.nombre ASC`,
                [despacho.id]
            )

            despachosConProductos.push({
                ...despacho,
                productos: productos
            })
        }

        connection.release()

        return {
            success: true,
            despachos: despachosConProductos
        }

    } catch (error) {
        console.error('Error al obtener historial de despachos:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar historial de despachos'
        }
    }
}

export async function procesarDespacho(ventaId, productosDespacho, observaciones) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        const [venta] = await connection.execute(
            `SELECT id, tipo_entrega, despacho_completo, estado, empresa_id 
            FROM ventas 
            WHERE id = ? AND empresa_id = ?`,
            [ventaId, empresaId]
        )

        if (venta.length === 0) {
            await connection.rollback()
            connection.release()
            return {
                success: false,
                mensaje: 'Venta no encontrada'
            }
        }

        if (venta[0].tipo_entrega !== 'parcial' || venta[0].despacho_completo || venta[0].estado !== 'emitida') {
            await connection.rollback()
            connection.release()
            return {
                success: false,
                mensaje: 'Esta venta no puede ser despachada'
            }
        }

        const [ultimoDespacho] = await connection.execute(
            `SELECT MAX(numero_despacho) as ultimo_numero
            FROM despachos
            WHERE venta_id = ?`,
            [ventaId]
        )

        const numeroDespacho = (ultimoDespacho[0].ultimo_numero || 0) + 1

        const [resultadoDespacho] = await connection.execute(
            `INSERT INTO despachos (
                venta_id,
                numero_despacho,
                usuario_id,
                observaciones,
                estado
            ) VALUES (?, ?, ?, ?, 'activo')`,
            [ventaId, numeroDespacho, userId, observaciones]
        )

        const despachoId = resultadoDespacho.insertId

        for (const productoDespacho of productosDespacho) {
            const [detalle] = await connection.execute(
                `SELECT 
                    id,
                    producto_id,
                    cantidad_pendiente
                FROM detalle_ventas
                WHERE id = ? AND venta_id = ?`,
                [productoDespacho.detalle_venta_id, ventaId]
            )

            if (detalle.length === 0) {
                await connection.rollback()
                connection.release()
                return {
                    success: false,
                    mensaje: 'Producto no encontrado en la venta'
                }
            }

            if (productoDespacho.cantidad > detalle[0].cantidad_pendiente) {
                await connection.rollback()
                connection.release()
                return {
                    success: false,
                    mensaje: 'No puedes despachar mas de lo pendiente'
                }
            }

            const [producto] = await connection.execute(
                `SELECT stock FROM productos WHERE id = ? AND empresa_id = ?`,
                [detalle[0].producto_id, empresaId]
            )

            if (producto.length === 0 || producto[0].stock < productoDespacho.cantidad) {
                await connection.rollback()
                connection.release()
                return {
                    success: false,
                    mensaje: 'Stock insuficiente para completar el despacho'
                }
            }

            await connection.execute(
                `INSERT INTO detalle_despachos (
                    despacho_id,
                    detalle_venta_id,
                    cantidad_despachada
                ) VALUES (?, ?, ?)`,
                [despachoId, productoDespacho.detalle_venta_id, productoDespacho.cantidad]
            )

            await connection.execute(
                `UPDATE detalle_ventas
                SET cantidad_despachada = cantidad_despachada + ?,
                    cantidad_pendiente = cantidad_pendiente - ?
                WHERE id = ?`,
                [productoDespacho.cantidad, productoDespacho.cantidad, productoDespacho.detalle_venta_id]
            )

            await connection.execute(
                `UPDATE productos
                SET stock = stock - ?
                WHERE id = ? AND empresa_id = ?`,
                [productoDespacho.cantidad, detalle[0].producto_id, empresaId]
            )

            const [productoActualizado] = await connection.execute(
                `SELECT stock FROM productos WHERE id = ?`,
                [detalle[0].producto_id]
            )

            await connection.execute(
                `INSERT INTO movimientos_inventario (
                    empresa_id,
                    producto_id,
                    tipo,
                    cantidad,
                    stock_anterior,
                    stock_nuevo,
                    referencia,
                    usuario_id,
                    notas
                ) VALUES (?, ?, 'salida', ?, ?, ?, ?, ?, ?)`,
                [
                    empresaId,
                    detalle[0].producto_id,
                    productoDespacho.cantidad,
                    productoActualizado[0].stock + productoDespacho.cantidad,
                    productoActualizado[0].stock,
                    `Despacho ${numeroDespacho} - Venta ${ventaId}`,
                    userId,
                    observaciones || 'Despacho parcial'
                ]
            )
        }

        const [cantidadPendiente] = await connection.execute(
            `SELECT SUM(cantidad_pendiente) as total_pendiente
            FROM detalle_ventas
            WHERE venta_id = ?`,
            [ventaId]
        )

        const despachoCompleto = cantidadPendiente[0].total_pendiente === 0

        await connection.execute(
            `UPDATE ventas
            SET despacho_completo = ?
            WHERE id = ?`,
            [despachoCompleto, ventaId]
        )

        await connection.commit()
        connection.release()

        return {
            success: true,
            mensaje: despachoCompleto 
                ? 'Despacho completado. Todos los productos fueron entregados' 
                : 'Despacho procesado exitosamente. Aun quedan productos pendientes'
        }

    } catch (error) {
        console.error('Error al procesar despacho:', error)
        
        if (connection) {
            await connection.rollback()
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al procesar el despacho'
        }
    }
}