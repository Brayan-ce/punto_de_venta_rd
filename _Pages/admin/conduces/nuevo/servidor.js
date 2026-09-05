"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import { formatearNumeroConduce } from "@/utils/conduceUtils"
import { validarDatosConduce, validarSaldoDisponible } from "../lib"

/**
 * =====================================================
 * NUEVO/SERVIDOR.JS - CREAR CONDUCE
 * =====================================================
 */

export async function crearConduce(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) return { success: false, mensaje: 'Sesion invalida' }

        // Validar datos usando lib.js
        const validacion = validarDatosConduce(datos)
        if (!validacion.valido) {
            return { 
                success: false, 
                mensaje: validacion.errores.join(', ') 
            }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        // 1. Obtener numeración
        const [settings] = await connection.execute(
            `SELECT name, value FROM settings WHERE empresa_id = ? AND name IN ('conduce_prefijo', 'conduce_numero_actual')`,
            [empresaId]
        )
        const prefijo = settings.find(s => s.name === 'conduce_prefijo')?.value || 'COND'
        const numeroActual = settings.find(s => s.name === 'conduce_numero_actual')?.value || '1'
        const numeroConduce = formatearNumeroConduce(prefijo, numeroActual)

        // 2. Insertar conduce
        const [resCon] = await connection.execute(
            `INSERT INTO conduces (
                empresa_id, tipo_origen, origen_id, numero_origen,
                numero_conduce, fecha_conduce, cliente_id, usuario_id,
                chofer, vehiculo, placa, estado, observaciones
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'emitido', ?)`,
            [
                empresaId, datos.tipo_origen, datos.origen_id, datos.numero_origen,
                numeroConduce, datos.fecha_conduce, datos.cliente_id, userId,
                datos.chofer, datos.vehiculo, datos.placa, datos.observaciones
            ]
        )
        const conduceId = resCon.insertId

        // 3. Validar y procesar detalles y actualizar saldos
        for (const item of datos.productos) {
            // Verificar saldo disponible antes de despachar
            const [saldos] = await connection.execute(
                `SELECT cantidad_pendiente FROM saldo_despacho
                 WHERE empresa_id = ? AND tipo_origen = ? AND origen_id = ? AND producto_id = ?`,
                [empresaId, datos.tipo_origen, datos.origen_id, item.producto_id]
            )

            if (saldos.length === 0) {
                throw new Error(`No se encontró saldo para el producto ${item.nombre_producto}`)
            }

            const saldoDisponible = parseFloat(saldos[0].cantidad_pendiente)
            const cantidadADespachar = parseFloat(item.cantidad_a_despachar)

            // Validar saldo usando lib.js
            const validacionSaldo = validarSaldoDisponible(saldoDisponible, cantidadADespachar)
            if (!validacionSaldo.valido) {
                throw new Error(`${item.nombre_producto}: ${validacionSaldo.mensaje}`)
            }

            // Insertar detalle
            await connection.execute(
                `INSERT INTO conduce_detalle (conduce_id, producto_id, nombre_producto, cantidad_despachada)
                 VALUES (?, ?, ?, ?)`,
                [conduceId, item.producto_id, item.nombre_producto, cantidadADespachar]
            )

            // Actualizar saldo_despacho
            await connection.execute(
                `UPDATE saldo_despacho 
                 SET cantidad_despachada = cantidad_despachada + ?, 
                     cantidad_pendiente = cantidad_pendiente - ?
                 WHERE empresa_id = ? AND tipo_origen = ? AND origen_id = ? AND producto_id = ?`,
                [
                    cantidadADespachar, cantidadADespachar,
                    empresaId, datos.tipo_origen, datos.origen_id, item.producto_id
                ]
            )
        }

        // 4. Actualizar numeración
        await connection.execute(
            `UPDATE settings SET value = ? WHERE empresa_id = ? AND name = 'conduce_numero_actual'`,
            [(parseInt(numeroActual) + 1).toString(), empresaId]
        )

        await connection.commit()
        connection.release()
        return { 
            success: true, 
            mensaje: `Conduce ${numeroConduce} creado exitosamente`, 
            id: conduceId,
            numeroConduce 
        }

    } catch (error) {
        console.error('Error al crear conduce:', error)
        if (connection) {
            await connection.rollback()
            connection.release()
        }
        return { 
            success: false, 
            mensaje: error.message || 'Error al crear el conduce' 
        }
    }
}

