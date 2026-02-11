"use server"

import db from "@/_DB/db"
import {cookies} from 'next/headers'

/**
 * Obtiene una cotización por ID con su detalle
 */
export async function obtenerCotizacionPorId(id) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return {success: false, mensaje: 'Sesion invalida'}

        connection = await db.getConnection()

        const [cot] = await connection.execute(
            `SELECT c.*,
                    cl.nombre as cliente_nombre,
                    cl.numero_documento as cliente_documento,
                    cl.telefono as cliente_telefono,
                    cl.email as cliente_email,
                    cl.direccion as cliente_direccion,
                    cl.foto_url as cliente_foto,
                    td.codigo as cliente_tipo_documento_codigo,
                    td.nombre as cliente_tipo_documento_nombre
             FROM cotizaciones c
                      LEFT JOIN clientes cl ON c.cliente_id = cl.id
                      LEFT JOIN tipos_documento td ON cl.tipo_documento_id = td.id
             WHERE c.id = ?
               AND c.empresa_id = ?`,
            [id, empresaId]
        )

        if (cot.length === 0) {
            connection.release()
            return {success: false, mensaje: 'Cotización no encontrada'}
        }

        const [detalle] = await connection.execute(
            `SELECT cd.*, p.codigo_barras, p.imagen_url as producto_imagen
             FROM cotizacion_detalle cd
                      LEFT JOIN productos p ON cd.producto_id = p.id
             WHERE cd.cotizacion_id = ?`,
            [id]
        )

        connection.release()

        return {success: true, cotizacion: cot[0], detalle}

    } catch (error) {
        console.error('Error al obtener detalle de cotización:', error)
        if (connection) connection.release()
        return {success: false, mensaje: 'Error al cargar la cotización'}
    }
}

/**
 * Actualiza el estado de una cotización
 */
export async function actualizarEstadoCotizacion(id, estado) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return {success: false, mensaje: 'Sesion invalida'}

        connection = await db.getConnection()
        await connection.execute(
            `UPDATE cotizaciones
             SET estado = ?
             WHERE id = ?
               AND empresa_id = ?`,
            [estado, id, empresaId]
        )
        connection.release()

        return {success: true, mensaje: 'Estado actualizado'}

    } catch (error) {
        console.error('Error al actualizar estado:', error)
        if (connection) connection.release()
        return {success: false, mensaje: 'Error al actualizar estado'}
    }
}

/**
 * Convierte una cotización en una venta
 * Prepara los datos para el formulario de venta
 */
export async function convertirCotizacionAVenta(cotizacionId) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return {success: false, mensaje: 'Sesion invalida'}

        connection = await db.getConnection()

        // Obtener cotización
        const [cot] = await connection.execute(
            `SELECT c.*, cl.id as cliente_id, cl.nombre as cliente_nombre
             FROM cotizaciones c
                      LEFT JOIN clientes cl ON c.cliente_id = cl.id
             WHERE c.id = ?
               AND c.empresa_id = ?`,
            [cotizacionId, empresaId]
        )

        if (cot.length === 0) {
            connection.release()
            return {success: false, mensaje: 'Cotización no encontrada'}
        }

        const cotizacion = cot[0]

        // Obtener detalle de productos
        const [detalle] = await connection.execute(
            `SELECT cd.*, p.id as producto_id, p.nombre, p.precio_venta, p.stock, p.codigo_barras
             FROM cotizacion_detalle cd
                      LEFT JOIN productos p ON cd.producto_id = p.id
             WHERE cd.cotizacion_id = ?`,
            [cotizacionId]
        )

        // Verificar stock y preparar productos
        const productos = []
        const productosSinStock = []

        for (const item of detalle) {
            const stockDisponible = item.stock || 0
            const cantidadRequerida = item.cantidad || 0

            if (stockDisponible < cantidadRequerida) {
                productosSinStock.push({
                    nombre: item.nombre || item.nombre_producto,
                    stock_disponible: stockDisponible,
                    cantidad_requerida: cantidadRequerida
                })
            }

            productos.push({
                producto_id: item.producto_id,
                nombre: item.nombre || item.nombre_producto,
                cantidad: cantidadRequerida,
                precio_unitario: item.precio_unitario || item.precio_venta,
                descripcion: item.descripcion_producto || '',
                codigo_barras: item.codigo_barras || null
            })
        }

        connection.release()

        // Preparar datos para la venta
        const datosVenta = {
            cliente_id: cotizacion.cliente_id,
            productos: productos,
            descuento: cotizacion.descuento || 0,
            observaciones: `Convertida desde cotización ${cotizacion.numero_cotizacion}`,
            cotizacion_id: cotizacionId
        }

        return {
            success: true,
            data: datosVenta,
            productosSinStock: productosSinStock.length > 0 ? productosSinStock : null
        }

    } catch (error) {
        console.error('Error al convertir cotización a venta:', error)
        if (connection) connection.release()
        return {success: false, mensaje: 'Error al convertir la cotización'}
    }
}

