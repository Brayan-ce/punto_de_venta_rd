"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import { formatearNumeroCotizacion, calcularTotalesCotizacion } from "@/utils/cotizacionUtils"

/**
 * Crea una nueva cotización
 */
export async function crearCotizacion(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return { success: false, mensaje: 'Sesion invalida' }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        // 1. Obtener configuración de numeración
        const [settings] = await connection.execute(
            `SELECT name, value FROM settings WHERE empresa_id = ? AND name IN ('cotizacion_prefijo', 'cotizacion_numero_actual')`,
            [empresaId]
        )

        const prefijo = settings.find(s => s.name === 'cotizacion_prefijo')?.value || 'COT'
        const numeroActual = settings.find(s => s.name === 'cotizacion_numero_actual')?.value || '1'
        const numeroCotizacion = formatearNumeroCotizacion(prefijo, numeroActual)

        // 2. Calcular totales
        const totales = calcularTotalesCotizacion(datos.productos)

        // 3. Insertar cotización
        const [resCot] = await connection.execute(
            `INSERT INTO cotizaciones (
                empresa_id, cliente_id, usuario_id, numero_cotizacion, 
                estado, subtotal, descuento, monto_gravado, itbis, total, 
                fecha_emision, fecha_vencimiento, observaciones
            ) VALUES (?, ?, ?, ?, 'borrador', ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                empresaId, datos.cliente_id, userId, numeroCotizacion,
                totales.subtotal, datos.descuento || 0, totales.monto_gravado,
                totales.itbis, totales.total, datos.fecha_emision,
                datos.fecha_vencimiento, datos.observaciones
            ]
        )

        const cotizacionId = resCot.insertId

        // 4. Insertar detalle
        for (const prod of datos.productos) {
            const lineTotales = calcularTotalesCotizacion([prod])
            await connection.execute(
                `INSERT INTO cotizacion_detalle (
                    cotizacion_id, producto_id, nombre_producto, descripcion_producto,
                    cantidad, precio_unitario, subtotal, aplica_itbis, 
                    monto_gravado, itbis, total
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    cotizacionId, prod.producto_id, prod.nombre_producto, prod.descripcion_producto,
                    prod.cantidad, prod.precio_unitario, lineTotales.subtotal, prod.aplica_itbis ? 1 : 0,
                    lineTotales.monto_gravado, lineTotales.itbis, lineTotales.total
                ]
            )
        }

        // 5. Actualizar número actual en settings
        await connection.execute(
            `UPDATE settings SET value = ? WHERE empresa_id = ? AND name = 'cotizacion_numero_actual'`,
            [(parseInt(numeroActual) + 1).toString(), empresaId]
        )

        await connection.commit()
        connection.release()

        return { success: true, mensaje: 'Cotización creada exitosamente', id: cotizacionId }

    } catch (error) {
        console.error('Error al crear cotización:', error)
        if (connection) {
            await connection.rollback()
            connection.release()
        }
        return { success: false, mensaje: 'Error al crear la cotización' }
    }
}

