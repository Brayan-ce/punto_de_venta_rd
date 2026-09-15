"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

/**
 * =====================================================
 * SERVIDOR.JS - OPERACIONES GENERALES DE CONDUCES
 * =====================================================
 * 
 * Este archivo contiene solo operaciones generales:
 * - Listar conduces
 * - Buscar origen por número
 * - Obtener saldo pendiente
 * 
 * Las operaciones específicas (crear, editar, anular, etc.)
 * están en sus respectivas carpetas.
 */

// =====================================================
// LISTAR CONDUCES
// =====================================================

export async function listarConduces(filtros = {}) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        if (!empresaId) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()
        let query = `
            SELECT c.*, cl.nombre as cliente_nombre, u.nombre as usuario_nombre
            FROM conduces c
            LEFT JOIN clientes cl ON c.cliente_id = cl.id
            LEFT JOIN usuarios u ON c.usuario_id = u.id
            WHERE c.empresa_id = ?
        `
        const params = [empresaId]

        if (filtros.buscar) {
            query += " AND (c.numero_conduce LIKE ? OR c.numero_origen LIKE ? OR cl.nombre LIKE ? OR c.chofer LIKE ?)"
            params.push(`%${filtros.buscar}%`, `%${filtros.buscar}%`, `%${filtros.buscar}%`, `%${filtros.buscar}%`)
        }

        if (filtros.estado) {
            query += " AND c.estado = ?"
            params.push(filtros.estado)
        }

        if (filtros.tipoOrigen) {
            query += " AND c.tipo_origen = ?"
            params.push(filtros.tipoOrigen)
        }

        if (filtros.fechaDesde) {
            query += " AND c.fecha_conduce >= ?"
            params.push(filtros.fechaDesde)
        }

        if (filtros.fechaHasta) {
            query += " AND c.fecha_conduce <= ?"
            params.push(filtros.fechaHasta)
        }

        query += " ORDER BY c.created_at DESC"
        const [rows] = await connection.execute(query, params)
        connection.release()

        return { success: true, conduces: rows }
    } catch (error) {
        console.error('Error al listar conduces:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar conduces' }
    }
}

// =====================================================
// OBTENER SALDO PENDIENTE
// =====================================================

export async function obtenerSaldoPendiente(tipoOrigen, origenId) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        if (!empresaId) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()

        // Primero verificamos si hay registros en saldo_despacho
        const [saldos] = await connection.execute(
            `SELECT sd.*, p.nombre as nombre_producto, p.unidad_medida
             FROM saldo_despacho sd
             JOIN productos p ON sd.producto_id = p.id
             WHERE sd.empresa_id = ? AND sd.tipo_origen = ? AND sd.origen_id = ?`,
            [empresaId, tipoOrigen, origenId]
        )

        // Si no hay saldos, los inicializamos desde el origen (venta o cotización)
        if (saldos.length === 0) {
            let detalles = []
            
            if (tipoOrigen === 'venta') {
                [detalles] = await connection.execute(
                    `SELECT dv.producto_id, dv.cantidad, p.nombre as nombre_producto, p.unidad_medida
                     FROM detalle_ventas dv
                     JOIN productos p ON dv.producto_id = p.id
                     WHERE dv.venta_id = ?`,
                    [origenId]
                )
            } else if (tipoOrigen === 'cotizacion') {
                [detalles] = await connection.execute(
                    `SELECT cd.producto_id, cd.cantidad, p.nombre as nombre_producto, p.unidad_medida
                     FROM cotizacion_detalle cd
                     JOIN productos p ON cd.producto_id = p.id
                     WHERE cd.cotizacion_id = ?`,
                    [origenId]
                )
            }

            for (const item of detalles) {
                await connection.execute(
                    `INSERT IGNORE INTO saldo_despacho (
                        empresa_id, tipo_origen, origen_id, producto_id, 
                        cantidad_total, cantidad_despachada, cantidad_pendiente
                    ) VALUES (?, ?, ?, ?, ?, 0, ?)`,
                    [empresaId, tipoOrigen, origenId, item.producto_id, item.cantidad, item.cantidad]
                )
            }

            // Volvemos a consultar
            const [nuevosSaldos] = await connection.execute(
                `SELECT sd.*, p.nombre as nombre_producto, p.unidad_medida
                 FROM saldo_despacho sd
                 JOIN productos p ON sd.producto_id = p.id
                 WHERE sd.empresa_id = ? AND sd.tipo_origen = ? AND sd.origen_id = ?`,
                [empresaId, tipoOrigen, origenId]
            )
            connection.release()
            return { success: true, saldos: nuevosSaldos }
        }

        return { success: true, saldos }

    } catch (error) {
        console.error('Error al obtener saldos:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al verificar saldos' }
    }
}

// =====================================================
// BUSCAR ORIGEN POR NÚMERO
// =====================================================

export async function buscarOrigenPorNumero(tipo, numero) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        if (!empresaId) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()
        let res
        if (tipo === 'venta') {
            [res] = await connection.execute(
                `SELECT v.id, v.numero_interno as numero, c.nombre as cliente_nombre, v.cliente_id, v.estado
                 FROM ventas v
                 LEFT JOIN clientes c ON v.cliente_id = c.id
                 WHERE v.numero_interno = ? AND v.empresa_id = ? AND v.estado != 'anulada'`,
                [numero, empresaId]
            )
        } else {
            [res] = await connection.execute(
                `SELECT c.id, c.numero_cotizacion as numero, cl.nombre as cliente_nombre, c.cliente_id, c.estado
                 FROM cotizaciones c
                 LEFT JOIN clientes cl ON c.cliente_id = cl.id
                 WHERE c.numero_cotizacion = ? AND c.empresa_id = ? AND c.estado != 'anulada'`,
                [numero, empresaId]
            )
        }

        connection.release()
        if (res.length > 0) {
            return { success: true, origen: res[0] }
        } else {
            return { success: false, mensaje: 'No se encontró el origen especificado' }
        }
    } catch (error) {
        console.error('Error al buscar origen:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al buscar' }
    }
}
