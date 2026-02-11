"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerInventario() {
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
                p.codigo_barras,
                p.sku,
                p.nombre,
                p.stock,
                p.stock_minimo,
                p.stock_maximo,
                p.precio_venta,
                p.imagen_url,
                p.categoria_id,
                p.permite_decimales,
                cat.nombre as categoria_nombre,
                um.abreviatura as unidad_medida_abreviatura
            FROM productos p
            LEFT JOIN categorias cat ON p.categoria_id = cat.id
            LEFT JOIN unidades_medida um ON p.unidad_medida_id = um.id
            WHERE p.empresa_id = ?
            AND p.activo = TRUE
            ORDER BY p.nombre ASC`,
            [empresaId]
        )

        const [movimientos] = await connection.execute(
            `SELECT 
                m.id,
                m.tipo,
                m.cantidad,
                m.stock_anterior,
                m.stock_nuevo,
                m.referencia,
                m.notas,
                m.fecha_movimiento,
                p.nombre as producto_nombre,
                u.nombre as usuario_nombre
            FROM movimientos_inventario m
            INNER JOIN productos p ON m.producto_id = p.id
            INNER JOIN usuarios u ON m.usuario_id = u.id
            WHERE m.empresa_id = ?
            ORDER BY m.fecha_movimiento DESC
            LIMIT 50`,
            [empresaId]
        )

        const [categorias] = await connection.execute(
            `SELECT id, nombre
            FROM categorias
            WHERE empresa_id = ?
            AND activo = TRUE
            ORDER BY nombre ASC`,
            [empresaId]
        )

        connection.release()

        return {
            success: true,
            productos: productos,
            movimientos: movimientos,
            categorias: categorias
        }

    } catch (error) {
        console.error('Error al obtener inventario:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar inventario'
        }
    }
}

export async function registrarMovimiento(datosMovimiento) {
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

        if (userTipo !== 'admin' && userTipo !== 'vendedor') {
            return {
                success: false,
                mensaje: 'No tienes permisos para registrar movimientos'
            }
        }

        connection = await db.getConnection()

        await connection.beginTransaction()

        const [producto] = await connection.execute(
            `SELECT stock FROM productos WHERE id = ? AND empresa_id = ? FOR UPDATE`,
            [datosMovimiento.producto_id, empresaId]
        )

        if (producto.length === 0) {
            await connection.rollback()
            connection.release()
            return {
                success: false,
                mensaje: 'Producto no encontrado'
            }
        }

        const stockActual = parseFloat(producto[0].stock) || 0.000
        let nuevoStock = stockActual
        const cantidadDecimal = parseFloat(datosMovimiento.cantidad) || 0.000

        switch(datosMovimiento.tipo) {
            case 'entrada':
            case 'devolucion':
                nuevoStock = stockActual + cantidadDecimal
                break
            case 'salida':
            case 'merma':
                if (cantidadDecimal > stockActual) {
                    await connection.rollback()
                    connection.release()
                    return {
                        success: false,
                        mensaje: 'Stock insuficiente'
                    }
                }
                nuevoStock = stockActual - cantidadDecimal
                break
            case 'ajuste':
                nuevoStock = cantidadDecimal
                break
        }

        await connection.execute(
            `UPDATE productos SET stock = ? WHERE id = ? AND empresa_id = ?`,
            [nuevoStock, datosMovimiento.producto_id, empresaId]
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
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                empresaId,
                datosMovimiento.producto_id,
                datosMovimiento.tipo,
                datosMovimiento.cantidad,
                stockActual,
                nuevoStock,
                datosMovimiento.referencia,
                userId,
                datosMovimiento.notas
            ]
        )

        await connection.commit()
        connection.release()

        return {
            success: true,
            mensaje: 'Movimiento registrado exitosamente'
        }

    } catch (error) {
        console.error('Error al registrar movimiento:', error)
        
        if (connection) {
            await connection.rollback()
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al registrar movimiento'
        }
    }
}