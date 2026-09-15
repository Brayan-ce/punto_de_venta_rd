"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

async function validarDatosFiscalesCompra(connection, datosCompra, empresaId, compraId) {
    const proveedorId = Number(datosCompra.proveedor_id)
    const ncf = String(datosCompra.ncf || '').trim().toUpperCase()
    if (!Number.isInteger(proveedorId) || proveedorId <= 0) return 'Selecciona un proveedor válido'
    if (!ncf) return 'El NCF es requerido'

    const [proveedores] = await connection.execute(
        `SELECT rnc, activo FROM proveedores WHERE id = ? AND empresa_id = ? LIMIT 1`,
        [proveedorId, empresaId]
    )
    if (proveedores.length === 0 || !proveedores[0].activo) return 'El proveedor no existe o está inactivo'
    const rnc = String(proveedores[0].rnc || '').replace(/[^0-9]/g, '')
    if (![9, 11].includes(rnc.length)) return 'El proveedor debe tener un RNC válido de 9 u 11 dígitos'

    const [tipos] = await connection.execute(
        `SELECT prefijo_ncf FROM tipos_comprobante WHERE id = ? AND activo = TRUE LIMIT 1`,
        [datosCompra.tipo_comprobante_id]
    )
    if (tipos.length === 0) return 'El tipo de comprobante no es válido'
    const prefijo = String(tipos[0].prefijo_ncf || '').toUpperCase()
    if (prefijo && !ncf.startsWith(prefijo)) return `El NCF debe comenzar con ${prefijo}`
    if (!/^[A-Z]\d{9,18}$/.test(ncf)) return 'El formato del NCF no es válido'

    const [duplicados] = await connection.execute(
        `SELECT id FROM compras WHERE ncf = ? AND empresa_id = ? AND id <> ?`,
        [ncf, empresaId, compraId]
    )
    if (duplicados.length > 0) return 'Ya existe otra compra con ese NCF'
    return null
}

export async function obtenerCompra(compraId) {
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
                c.fecha_compra
            FROM compras c
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
                p.nombre as producto_nombre
            FROM detalle_compras dc
            INNER JOIN productos p ON dc.producto_id = p.id
            WHERE dc.compra_id = ?`,
            [compraId]
        )

        connection.release()

        return {
            success: true,
            compra: {
                ...compras[0],
                detalles: detalles
            }
        }

    } catch (error) {
        console.error('Error al obtener compra:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar compra'
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

export async function actualizarCompra(compraId, datosCompra) {
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
                mensaje: 'No tienes permisos para editar compras'
            }
        }

        connection = await db.getConnection()

        await connection.beginTransaction()

        const [compraExistente] = await connection.execute(
            `SELECT id, estado FROM compras WHERE id = ? AND empresa_id = ?`,
            [compraId, empresaId]
        )

        if (compraExistente.length === 0) {
            await connection.rollback()
            connection.release()
            return {
                success: false,
                mensaje: 'Compra no encontrada'
            }
        }

        if (compraExistente[0].estado === 'anulada') {
            await connection.rollback()
            connection.release()
            return {
                success: false,
                mensaje: 'No se puede editar una compra anulada'
            }
        }

        const errorFiscal = await validarDatosFiscalesCompra(connection, datosCompra, empresaId, compraId)
        if (errorFiscal) {
            await connection.rollback()
            connection.release()
            return { success: false, mensaje: errorFiscal }
        }

        const [detallesAnteriores] = await connection.execute(
            `SELECT producto_id, cantidad FROM detalle_compras WHERE compra_id = ?`,
            [compraId]
        )

        for (const detalle of detallesAnteriores) {
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
                ) VALUES (?, ?, 'salida', ?, ?, ?, ?, ?, 'Reversion por edicion de compra', NOW())`,
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
            `DELETE FROM detalle_compras WHERE compra_id = ?`,
            [compraId]
        )

        await connection.execute(
            `UPDATE compras 
            SET tipo_comprobante_id = ?,
                ncf = ?,
                proveedor_id = ?,
                subtotal = ?,
                itbis = ?,
                total = ?,
                metodo_pago = ?,
                notas = ?
            WHERE id = ? AND empresa_id = ?`,
            [
                datosCompra.tipo_comprobante_id,
                datosCompra.ncf,
                datosCompra.proveedor_id,
                datosCompra.subtotal,
                datosCompra.itbis,
                datosCompra.total,
                datosCompra.metodo_pago,
                datosCompra.notas,
                compraId,
                empresaId
            ]
        )

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
                ) VALUES (?, ?, 'entrada', ?, ?, ?, ?, ?, 'Actualizacion de compra', NOW())`,
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
            mensaje: 'Compra actualizada exitosamente'
        }

    } catch (error) {
        console.error('Error al actualizar compra:', error)
        
        if (connection) {
            await connection.rollback()
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al actualizar la compra'
        }
    }
}