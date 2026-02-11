"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerCompras() {
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
                c.ncf,
                c.subtotal,
                c.itbis,
                c.total,
                c.metodo_pago,
                c.estado,
                c.fecha_compra,
                c.proveedor_id,
                p.nombre_comercial as proveedor_nombre,
                tc.nombre as tipo_comprobante_nombre
            FROM compras c
            INNER JOIN proveedores p ON c.proveedor_id = p.id
            LEFT JOIN tipos_comprobante tc ON c.tipo_comprobante_id = tc.id
            WHERE c.empresa_id = ?
            ORDER BY c.fecha_compra DESC`,
            [empresaId]
        )

        const [proveedores] = await connection.execute(
            `SELECT id, nombre_comercial, razon_social
            FROM proveedores
            WHERE empresa_id = ?
            AND activo = TRUE
            ORDER BY nombre_comercial ASC`,
            [empresaId]
        )

        connection.release()

        return {
            success: true,
            compras: compras,
            proveedores: proveedores
        }

    } catch (error) {
        console.error('Error al obtener compras:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar compras'
        }
    }
}

export async function obtenerDatosFormulario() {
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

        const [proveedores] = await connection.execute(
            `SELECT id, nombre_comercial, razon_social, rnc
            FROM proveedores
            WHERE empresa_id = ?
            AND activo = TRUE
            ORDER BY nombre_comercial ASC`,
            [empresaId]
        )

        const [productos] = await connection.execute(
            `SELECT id, nombre, codigo_barras, precio_compra
            FROM productos
            WHERE empresa_id = ?
            AND activo = TRUE
            ORDER BY nombre ASC`,
            [empresaId]
        )

        const [tiposComprobante] = await connection.execute(
            `SELECT id, codigo, nombre
            FROM tipos_comprobante
            WHERE activo = TRUE
            ORDER BY codigo ASC`
        )

        connection.release()

        return {
            success: true,
            proveedores: proveedores,
            productos: productos,
            tiposComprobante: tiposComprobante
        }

    } catch (error) {
        console.error('Error al obtener datos del formulario:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar datos'
        }
    }
}

export async function crearCompra(datosCompra) {
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
                mensaje: 'No tienes permisos para crear compras'
            }
        }

        connection = await db.getConnection()

        await connection.beginTransaction()

        const [existeNCF] = await connection.execute(
            `SELECT id FROM compras WHERE ncf = ? AND empresa_id = ?`,
            [datosCompra.ncf, empresaId]
        )

        if (existeNCF.length > 0) {
            await connection.rollback()
            connection.release()
            return {
                success: false,
                mensaje: 'Ya existe una compra con ese NCF'
            }
        }

        const [resultadoCompra] = await connection.execute(
            `INSERT INTO compras (
                empresa_id,
                tipo_comprobante_id,
                ncf,
                proveedor_id,
                usuario_id,
                subtotal,
                itbis,
                total,
                metodo_pago,
                estado,
                notas,
                fecha_compra
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'recibida', ?, NOW())`,
            [
                empresaId,
                datosCompra.tipo_comprobante_id,
                datosCompra.ncf,
                datosCompra.proveedor_id,
                userId,
                datosCompra.subtotal,
                datosCompra.itbis,
                datosCompra.total,
                datosCompra.metodo_pago,
                datosCompra.notas
            ]
        )

        const compraId = resultadoCompra.insertId

        for (const producto of datosCompra.productos) {
            let productoId = producto.producto_id

            if (producto.esNuevo) {
                const [nuevoProducto] = await connection.execute(
                    `INSERT INTO productos (
                        empresa_id,
                        nombre,
                        precio_compra,
                        precio_venta,
                        stock,
                        activo
                    ) VALUES (?, ?, ?, ?, ?, TRUE)`,
                    [
                        empresaId,
                        producto.nombre,
                        producto.precio_unitario,
                        producto.precio_unitario * 1.3,
                        producto.cantidad
                    ]
                )
                productoId = nuevoProducto.insertId
            } else {
                await connection.execute(
                    `UPDATE productos 
                    SET stock = stock + ?,
                        precio_compra = ?
                    WHERE id = ? AND empresa_id = ?`,
                    [producto.cantidad, producto.precio_unitario, productoId, empresaId]
                )
            }

            await connection.execute(
                `INSERT INTO detalle_compras (
                    compra_id,
                    producto_id,
                    cantidad,
                    precio_unitario,
                    subtotal
                ) VALUES (?, ?, ?, ?, ?)`,
                [
                    compraId,
                    productoId,
                    producto.cantidad,
                    producto.precio_unitario,
                    producto.subtotal
                ]
            )

            const [productoActual] = await connection.execute(
                `SELECT stock FROM productos WHERE id = ?`,
                [productoId]
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
                ) VALUES (?, ?, 'entrada', ?, ?, ?, ?, ?, 'Compra a proveedor', NOW())`,
                [
                    empresaId,
                    productoId,
                    producto.cantidad,
                    productoActual[0].stock - producto.cantidad,
                    productoActual[0].stock,
                    `COMPRA-${compraId}`,
                    userId
                ]
            )
        }

        await connection.commit()
        connection.release()

        return {
            success: true,
            mensaje: 'Compra registrada exitosamente',
            compraId: compraId
        }

    } catch (error) {
        console.error('Error al crear compra:', error)
        
        if (connection) {
            await connection.rollback()
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al registrar la compra'
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
            await connection.execute(
                `UPDATE productos 
                SET stock = stock - ?
                WHERE id = ? AND empresa_id = ?`,
                [detalle.cantidad, detalle.producto_id, empresaId]
            )

            const [productoActual] = await connection.execute(
                `SELECT stock FROM productos WHERE id = ?`,
                [detalle.producto_id]
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
                    productoActual[0].stock + detalle.cantidad,
                    productoActual[0].stock,
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