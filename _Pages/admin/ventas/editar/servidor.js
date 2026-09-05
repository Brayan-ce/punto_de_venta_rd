"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerVentaEditar(ventaId) {
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
                v.tipo_comprobante_id,
                v.ncf,
                v.numero_interno,
                v.cliente_id,
                v.subtotal,
                v.descuento,
                v.monto_gravado,
                v.itbis,
                v.total,
                v.metodo_pago,
                v.efectivo_recibido,
                v.cambio,
                v.estado,
                v.notas
            FROM ventas v
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

        if (venta[0].estado !== 'emitida') {
            connection.release()
            return {
                success: false,
                mensaje: 'Solo se pueden editar ventas emitidas'
            }
        }

        const [empresa] = await connection.execute(
            `SELECT 
                id,
                nombre_empresa,
                rnc,
                impuesto_nombre,
                impuesto_porcentaje,
                moneda,
                locale,
                simbolo_moneda
            FROM empresas
            WHERE id = ? AND activo = TRUE`,
            [empresaId]
        )

        if (empresa.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Empresa no encontrada'
            }
        }

        const [tiposComprobante] = await connection.execute(
            `SELECT 
                id,
                codigo,
                nombre,
                prefijo_ncf,
                requiere_rnc,
                requiere_razon_social
            FROM tipos_comprobante
            WHERE activo = TRUE
            ORDER BY codigo ASC`
        )

        let cliente = null
        if (venta[0].cliente_id) {
            const [clienteData] = await connection.execute(
                `SELECT 
                    c.id,
                    c.nombre,
                    c.numero_documento,
                    td.codigo as tipo_documento
                FROM clientes c
                INNER JOIN tipos_documento td ON c.tipo_documento_id = td.id
                WHERE c.id = ?`,
                [venta[0].cliente_id]
            )
            if (clienteData.length > 0) {
                cliente = clienteData[0]
            }
        }

        const [detalleVenta] = await connection.execute(
            `SELECT 
                dv.id,
                dv.producto_id,
                dv.cantidad,
                dv.precio_unitario,
                p.nombre as nombre_producto,
                p.codigo_barras,
                p.sku,
                p.stock as stock_actual,
                p.precio_venta,
                p.aplica_itbis
            FROM detalle_ventas dv
            INNER JOIN productos p ON dv.producto_id = p.id
            WHERE dv.venta_id = ?`,
            [ventaId]
        )

        connection.release()

        return {
            success: true,
            empresa: empresa[0],
            tiposComprobante: tiposComprobante,
            venta: {
                ...venta[0],
                cliente: cliente,
                productos: detalleVenta
            }
        }

    } catch (error) {
        console.error('Error al obtener venta para editar:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar datos de la venta'
        }
    }
}

export async function buscarProductos(termino) {
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

        const [productos] = await connection.execute(
            `SELECT 
                id,
                codigo_barras,
                sku,
                nombre,
                precio_venta,
                stock,
                aplica_itbis
            FROM productos
            WHERE empresa_id = ?
            AND activo = TRUE
            AND (
                nombre LIKE ? OR
                codigo_barras LIKE ? OR
                sku LIKE ?
            )
            AND stock > 0
            ORDER BY nombre ASC
            LIMIT 20`,
            [empresaId, `%${termino}%`, `%${termino}%`, `%${termino}%`]
        )

        connection.release()

        return {
            success: true,
            productos: productos
        }

    } catch (error) {
        console.error('Error al buscar productos:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al buscar productos'
        }
    }
}

export async function buscarClientes(termino) {
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

        const [clientes] = await connection.execute(
            `SELECT 
                c.id,
                c.nombre,
                c.numero_documento,
                td.codigo as tipo_documento
            FROM clientes c
            INNER JOIN tipos_documento td ON c.tipo_documento_id = td.id
            WHERE c.empresa_id = ?
            AND c.activo = TRUE
            AND (
                c.nombre LIKE ? OR
                c.numero_documento LIKE ?
            )
            ORDER BY c.nombre ASC
            LIMIT 20`,
            [empresaId, `%${termino}%`, `%${termino}%`]
        )

        connection.release()

        return {
            success: true,
            clientes: clientes
        }

    } catch (error) {
        console.error('Error al buscar clientes:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al buscar clientes'
        }
    }
}

export async function actualizarVenta(datosVenta) {
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

        const [ventaActual] = await connection.execute(
            `SELECT id, estado FROM ventas WHERE id = ? AND empresa_id = ?`,
            [datosVenta.venta_id, empresaId]
        )

        if (ventaActual.length === 0) {
            await connection.rollback()
            connection.release()
            return {
                success: false,
                mensaje: 'Venta no encontrada'
            }
        }

        if (ventaActual[0].estado !== 'emitida') {
            await connection.rollback()
            connection.release()
            return {
                success: false,
                mensaje: 'Solo se pueden editar ventas emitidas'
            }
        }

        const [productosAnteriores] = await connection.execute(
            `SELECT producto_id, cantidad 
            FROM detalle_ventas 
            WHERE venta_id = ?`,
            [datosVenta.venta_id]
        )

        for (const productoAnterior of productosAnteriores) {
            await connection.execute(
                `UPDATE productos 
                SET stock = stock + ? 
                WHERE id = ? AND empresa_id = ?`,
                [productoAnterior.cantidad, productoAnterior.producto_id, empresaId]
            )

            const [productoActualizado] = await connection.execute(
                `SELECT stock FROM productos WHERE id = ?`,
                [productoAnterior.producto_id]
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
                ) VALUES (?, ?, 'entrada', ?, ?, ?, ?, ?, ?)`,
                [
                    empresaId,
                    productoAnterior.producto_id,
                    productoAnterior.cantidad,
                    productoActualizado[0].stock - productoAnterior.cantidad,
                    productoActualizado[0].stock,
                    `VENTA-${datosVenta.venta_id}`,
                    userId,
                    `Devolucion por edicion de venta`
                ]
            )
        }

        await connection.execute(
            `DELETE FROM detalle_ventas WHERE venta_id = ?`,
            [datosVenta.venta_id]
        )

        for (const producto of datosVenta.productos) {
            const [stockActual] = await connection.execute(
                `SELECT stock FROM productos WHERE id = ? AND empresa_id = ?`,
                [producto.producto_id, empresaId]
            )

            if (stockActual.length === 0) {
                await connection.rollback()
                connection.release()
                return {
                    success: false,
                    mensaje: 'Producto no encontrado'
                }
            }

            if (stockActual[0].stock < producto.cantidad) {
                await connection.rollback()
                connection.release()
                return {
                    success: false,
                    mensaje: `Stock insuficiente para el producto ID ${producto.producto_id}`
                }
            }
        }

        await connection.execute(
            `UPDATE ventas 
            SET 
                tipo_comprobante_id = ?,
                cliente_id = ?,
                subtotal = ?,
                descuento = ?,
                monto_gravado = ?,
                itbis = ?,
                total = ?,
                metodo_pago = ?,
                efectivo_recibido = ?,
                cambio = ?,
                notas = ?
            WHERE id = ? AND empresa_id = ?`,
            [
                datosVenta.tipo_comprobante_id,
                datosVenta.cliente_id,
                datosVenta.subtotal,
                datosVenta.descuento,
                datosVenta.monto_gravado,
                datosVenta.itbis,
                datosVenta.total,
                datosVenta.metodo_pago,
                datosVenta.efectivo_recibido,
                datosVenta.cambio,
                datosVenta.notas,
                datosVenta.venta_id,
                empresaId
            ]
        )

        for (const producto of datosVenta.productos) {
            const subtotalProducto = producto.cantidad * producto.precio_unitario
            const montoGravado = subtotalProducto
            const [empresa] = await connection.execute(
                `SELECT impuesto_porcentaje FROM empresas WHERE id = ?`,
                [empresaId]
            )
            const itbisProducto = (montoGravado * parseFloat(empresa[0].impuesto_porcentaje)) / 100
            const totalProducto = subtotalProducto + itbisProducto

            await connection.execute(
                `INSERT INTO detalle_ventas (
                    venta_id,
                    producto_id,
                    cantidad,
                    cantidad_despachada,
                    precio_unitario,
                    subtotal,
                    descuento,
                    monto_gravado,
                    itbis,
                    total
                ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
                [
                    datosVenta.venta_id,
                    producto.producto_id,
                    producto.cantidad,
                    producto.cantidad,
                    producto.precio_unitario,
                    subtotalProducto,
                    montoGravado,
                    itbisProducto,
                    totalProducto
                ]
            )

            await connection.execute(
                `UPDATE productos 
                SET stock = stock - ? 
                WHERE id = ? AND empresa_id = ?`,
                [producto.cantidad, producto.producto_id, empresaId]
            )

            const [productoActualizado] = await connection.execute(
                `SELECT stock FROM productos WHERE id = ?`,
                [producto.producto_id]
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
                    producto.producto_id,
                    producto.cantidad,
                    productoActualizado[0].stock + producto.cantidad,
                    productoActualizado[0].stock,
                    `VENTA-${datosVenta.venta_id}`,
                    userId,
                    `Actualizacion de venta editada`
                ]
            )
        }

        await connection.commit()
        connection.release()

        return {
            success: true,
            mensaje: 'Venta actualizada exitosamente'
        }

    } catch (error) {
        console.error('Error al actualizar venta:', error)
        
        if (connection) {
            await connection.rollback()
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al actualizar la venta'
        }
    }
}