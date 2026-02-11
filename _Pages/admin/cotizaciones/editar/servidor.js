"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import { calcularTotalesCotizacion } from "@/utils/cotizacionUtils"
import { registrarHistorial } from '../historial/servidor'

/**
 * Obtiene una cotización para edición
 */
export async function obtenerCotizacionEditar(cotizacionId) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()

        const [cot] = await connection.execute(
            `SELECT c.*, cl.id as cliente_id, cl.nombre as cliente_nombre
             FROM cotizaciones c
             LEFT JOIN clientes cl ON c.cliente_id = cl.id
             WHERE c.id = ? AND c.empresa_id = ?`,
            [cotizacionId, empresaId]
        )

        if (cot.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Cotización no encontrada' }
        }

        const cotizacion = cot[0]

        // Verificar que se puede editar
        // Estados editables: borrador, enviada, aprobada, vencida
        // Estados no editables: convertida, anulada, rechazada
        const estadosEditables = ['borrador', 'enviada', 'aprobada', 'vencida']
        if (!estadosEditables.includes(cotizacion.estado)) {
            connection.release()
            return { 
                success: false, 
                mensaje: `Esta cotización no se puede editar porque está en estado "${cotizacion.estado}". Solo se pueden editar cotizaciones en estado: borrador, enviada, aprobada o vencida.` 
            }
        }

        const [detalle] = await connection.execute(
            `SELECT cd.*, p.codigo_barras, p.stock
             FROM cotizacion_detalle cd
             LEFT JOIN productos p ON cd.producto_id = p.id
             WHERE cd.cotizacion_id = ?`,
            [cotizacionId]
        )

        connection.release()

        return { 
            success: true, 
            cotizacion: cotizacion,
            detalle: detalle
        }

    } catch (error) {
        console.error('Error al obtener cotización para editar:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar la cotización' }
    }
}

/**
 * Actualiza una cotización existente
 */
export async function actualizarCotizacion(cotizacionId, datos) {
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

        // 1. Verificar que la cotización existe y se puede editar
        const [cot] = await connection.execute(
            `SELECT estado FROM cotizaciones WHERE id = ? AND empresa_id = ?`,
            [cotizacionId, empresaId]
        )

        if (cot.length === 0) {
            await connection.rollback()
            connection.release()
            return { success: false, mensaje: 'Cotización no encontrada' }
        }

        // Estados editables: borrador, enviada, aprobada, vencida
        // Estados no editables: convertida, anulada, rechazada
        const estadosEditables = ['borrador', 'enviada', 'aprobada', 'vencida']
        if (!estadosEditables.includes(cot[0].estado)) {
            await connection.rollback()
            connection.release()
            return { 
                success: false, 
                mensaje: `Esta cotización no se puede editar porque está en estado "${cot[0].estado}". Solo se pueden editar cotizaciones en estado: borrador, enviada, aprobada o vencida.` 
            }
        }

        // 2. Calcular totales
        const totales = calcularTotalesCotizacion(datos.productos)

        // 3. Actualizar cotización
        await connection.execute(
            `UPDATE cotizaciones 
             SET cliente_id = ?,
                 subtotal = ?,
                 descuento = ?,
                 monto_gravado = ?,
                 itbis = ?,
                 total = ?,
                 fecha_emision = ?,
                 fecha_vencimiento = ?,
                 observaciones = ?
             WHERE id = ? AND empresa_id = ?`,
            [
                datos.cliente_id,
                totales.subtotal,
                datos.descuento || 0,
                totales.monto_gravado,
                totales.itbis,
                totales.total,
                datos.fecha_emision,
                datos.fecha_vencimiento,
                datos.observaciones,
                cotizacionId,
                empresaId
            ]
        )

        // 4. Eliminar detalle anterior
        await connection.execute(
            `DELETE FROM cotizacion_detalle WHERE cotizacion_id = ?`,
            [cotizacionId]
        )

        // 5. Insertar nuevo detalle
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

        // 6. Registrar en historial
        await registrarHistorial(
            cotizacionId,
            'editada',
            null,
            null,
            null,
            'Cotización actualizada'
        )

        await connection.commit()
        connection.release()

        return { success: true, mensaje: 'Cotización actualizada exitosamente', id: cotizacionId }

    } catch (error) {
        console.error('Error al actualizar cotización:', error)
        if (connection) {
            await connection.rollback()
            connection.release()
        }
        return { success: false, mensaje: 'Error al actualizar la cotización' }
    }
}

