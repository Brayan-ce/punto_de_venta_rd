"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerDetalleCompra(compraId) {
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

        const [compras] = await connection.execute(
            `SELECT 
                c.id,
                c.tipo_comprobante_id,
                c.ncf,
                c.proveedor_id,
                c.subtotal,
                c.itbis,
                c.total,
                c.metodo_pago,
                c.estado,
                c.notas,
                c.fecha_compra,
                tc.nombre as tipo_comprobante_nombre,
                p.nombre_comercial as proveedor_nombre,
                p.rnc as proveedor_rnc,
                p.razon_social as proveedor_razon_social,
                u.nombre as usuario_nombre
            FROM compras c
            LEFT JOIN tipos_comprobante tc ON c.tipo_comprobante_id = tc.id
            INNER JOIN proveedores p ON c.proveedor_id = p.id
            INNER JOIN usuarios u ON c.usuario_id = u.id
            WHERE c.id = ? AND c.empresa_id = ?`,
            [compraId, empresaId]
        )

        if (compras.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Compra no encontrada'
            }
        }

        const [detalles] = await connection.execute(
            `SELECT 
                dc.id,
                dc.producto_id,
                dc.cantidad,
                dc.precio_unitario,
                dc.subtotal,
                p.nombre as producto_nombre,
                p.codigo_barras as producto_codigo
            FROM detalle_compras dc
            INNER JOIN productos p ON dc.producto_id = p.id
            WHERE dc.compra_id = ?
            ORDER BY dc.id ASC`,
            [compraId]
        )

        const [movimientos] = await connection.execute(
            `SELECT 
                mi.id,
                mi.producto_id,
                mi.tipo,
                mi.cantidad,
                mi.stock_anterior,
                mi.stock_nuevo,
                mi.referencia,
                mi.notas,
                mi.fecha_movimiento,
                p.nombre as producto_nombre
            FROM movimientos_inventario mi
            INNER JOIN productos p ON mi.producto_id = p.id
            WHERE mi.referencia = ?
            AND mi.empresa_id = ?
            ORDER BY mi.fecha_movimiento DESC`,
            [`COMPRA-${compraId}`, empresaId]
        )

        connection.release()

        return {
            success: true,
            compra: {
                ...compras[0],
                detalles: detalles,
                movimientos: movimientos
            }
        }

    } catch (error) {
        console.error('Error al obtener detalle de compra:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar detalle de compra'
        }
    }
}

export async function anularCompra(compraId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        if (userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para anular compras'
            }
        }

        connection = await db.getConnection()

        await connection.beginTransaction()

        const [compra] = await connection.execute(
            `SELECT id, estado FROM compras 
            WHERE id = ? AND empresa_id = ?`,
            [compraId, empresaId]
        )

        if (compra.length === 0) {
            await connection.rollback()
            connection.release()
            return {
                success: false,
                mensaje: 'Compra no encontrada'
            }
        }

        if (compra[0].estado === 'anulada') {
            await connection.rollback()
            connection.release()
            return {
                success: false,
                mensaje: 'Esta compra ya esta anulada'
            }
        }

        const [detalles] = await connection.execute(
            `SELECT producto_id, cantidad
            FROM detalle_compras
            WHERE compra_id = ?`,
            [compraId]
        )

        for (const detalle of detalles) {
            const [productoActual] = await connection.execute(
                `SELECT stock FROM productos WHERE id = ?`,
                [detalle.producto_id]
            )

            if (productoActual.length === 0) {
                continue
            }

            const nuevoStock = productoActual[0].stock - detalle.cantidad

            if (nuevoStock < 0) {
                await connection.rollback()
                connection.release()
                return {
                    success: false,
                    mensaje: 'No se puede anular: el stock resultante seria negativo'
                }
            }

            await connection.execute(
                `UPDATE productos 
                SET stock = ?
                WHERE id = ? AND empresa_id = ?`,
                [nuevoStock, detalle.producto_id, empresaId]
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
                    notas,
                    fecha_movimiento
                ) VALUES (?, ?, 'salida', ?, ?, ?, ?, ?, 'Anulacion de compra', NOW())`,
                [
                    empresaId,
                    detalle.producto_id,
                    detalle.cantidad,
                    productoActual[0].stock,
                    nuevoStock,
                    `COMPRA-${compraId}`,
                    userId
                ]
            )
        }

        await connection.execute(
            `UPDATE compras 
            SET estado = 'anulada'
            WHERE id = ? AND empresa_id = ?`,
            [compraId, empresaId]
        )

        await connection.commit()
        connection.release()

        return {
            success: true,
            mensaje: 'Compra anulada exitosamente'
        }

    } catch (error) {
        console.error('Error al anular compra:', error)
        
        if (connection) {
            await connection.rollback()
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al anular la compra'
        }
    }
}