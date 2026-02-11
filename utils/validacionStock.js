/**
 * Utilidades para validación de stock en cotizaciones
 */

import db from "@/_DB/db"

/**
 * Valida si hay stock disponible para los productos de una cotización
 */
export async function validarStockDisponible(productos, empresaId) {
    let connection
    try {
        connection = await db.getConnection()

        const productosSinStock = []
        const productosStockBajo = []

        for (const producto of productos) {
            const [stock] = await connection.execute(
                `SELECT stock, stock_minimo, nombre 
                 FROM productos 
                 WHERE id = ? AND empresa_id = ?`,
                [producto.producto_id, empresaId]
            )

            if (stock.length === 0) {
                productosSinStock.push({
                    producto_id: producto.producto_id,
                    nombre: producto.nombre_producto || 'Producto desconocido',
                    motivo: 'Producto no encontrado'
                })
                continue
            }

            const stockActual = stock[0].stock
            const cantidadRequerida = parseFloat(producto.cantidad) || 0

            if (stockActual < cantidadRequerida) {
                productosSinStock.push({
                    producto_id: producto.producto_id,
                    nombre: producto.nombre_producto || stock[0].nombre,
                    stock_disponible: stockActual,
                    cantidad_requerida: cantidadRequerida,
                    faltante: cantidadRequerida - stockActual
                })
            } else if (stockActual <= stock[0].stock_minimo) {
                productosStockBajo.push({
                    producto_id: producto.producto_id,
                    nombre: producto.nombre_producto || stock[0].nombre,
                    stock_actual: stockActual,
                    stock_minimo: stock[0].stock_minimo
                })
            }
        }

        connection.release()

        return {
            todoDisponible: productosSinStock.length === 0,
            productosSinStock,
            productosStockBajo,
            advertencias: productosStockBajo.length > 0
        }

    } catch (error) {
        console.error('Error al validar stock:', error)
        if (connection) connection.release()
        return {
            todoDisponible: false,
            productosSinStock: [],
            productosStockBajo: [],
            error: 'Error al validar stock'
        }
    }
}

/**
 * Valida stock al agregar un producto a cotización
 */
export async function validarStockAlCotizar(productoId, cantidad, empresaId) {
    let connection
    try {
        connection = await db.getConnection()

        const [producto] = await connection.execute(
            `SELECT stock, stock_minimo, nombre 
             FROM productos 
             WHERE id = ? AND empresa_id = ?`,
            [productoId, empresaId]
        )

        if (producto.length === 0) {
            connection.release()
            return { disponible: false, mensaje: 'Producto no encontrado' }
        }

        const stockActual = producto[0].stock
        const cantidadRequerida = parseFloat(cantidad) || 0

        if (stockActual < cantidadRequerida) {
            connection.release()
            return {
                disponible: false,
                mensaje: `Stock insuficiente. Disponible: ${stockActual}`,
                stock_disponible: stockActual
            }
        }

        if (stockActual <= producto[0].stock_minimo) {
            connection.release()
            return {
                disponible: true,
                advertencia: true,
                mensaje: `Stock bajo. Disponible: ${stockActual}`,
                stock_disponible: stockActual
            }
        }

        connection.release()
        return {
            disponible: true,
            stock_disponible: stockActual
        }

    } catch (error) {
        console.error('Error al validar stock:', error)
        if (connection) connection.release()
        return { disponible: false, mensaje: 'Error al validar stock' }
    }
}



















