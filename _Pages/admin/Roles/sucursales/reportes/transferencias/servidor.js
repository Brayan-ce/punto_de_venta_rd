"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerReporteTransferencias(filtros = {}) {
    let connection

    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userId = cookieStore.get('userId')?.value

        if (!empresaId || !userId) {
            return { success: false, mensaje: 'Sesion invalida' }
        }

        connection = await db.getConnection()

        let sucursalesAsignadas = []
        try {
            const [asignaciones] = await connection.execute(
                `SELECT DISTINCT sucursal_id
                 FROM usuarios_sucursales
                 WHERE usuario_id = ? AND empresa_id = ? AND activo = TRUE`,
                [userId, empresaId]
            )
            sucursalesAsignadas = asignaciones.map((item) => Number(item.sucursal_id))
        } catch (error) {
            console.warn('Tabla usuarios_sucursales no encontrada para reportes')
        }

        let query = `
            SELECT
                v.id,
                v.empresa_id,
                v.numero_transferencia,
                v.estado,
                v.prioridad,
                v.fecha_solicitud,
                CASE
                    WHEN UPPER(COALESCE(t.observacion_origen, '')) LIKE '[COMPARTIR]%' THEN 'compartir'
                    ELSE 'mover'
                END AS tipo_operacion,
                v.sucursal_origen,
                v.sucursal_destino,
                v.items,
                v.monto_estimado
            FROM vw_transferencias_resumen v
            INNER JOIN transferencias_stock t ON t.id = v.id
            WHERE v.empresa_id = ?
        `

        const params = [empresaId]

        if (sucursalesAsignadas.length > 0) {
            const placeholders = sucursalesAsignadas.map(() => '?').join(',')
            query += ` AND (t.sucursal_origen_id IN (${placeholders}) OR t.sucursal_destino_id IN (${placeholders}))`
            params.push(...sucursalesAsignadas, ...sucursalesAsignadas)
        }

        if (filtros.buscar) {
            query += ` AND (
                v.numero_transferencia LIKE ?
                OR v.sucursal_origen LIKE ?
                OR v.sucursal_destino LIKE ?
            )`
            const like = `%${filtros.buscar}%`
            params.push(like, like, like)
        }

        if (filtros.estado) {
            query += ' AND v.estado = ?'
            params.push(filtros.estado)
        }

        if (filtros.prioridad) {
            query += ' AND v.prioridad = ?'
            params.push(filtros.prioridad)
        }

        if (filtros.tipoOperacion) {
            if (filtros.tipoOperacion === 'compartir') {
                query += " AND UPPER(COALESCE(t.observacion_origen, '')) LIKE '[COMPARTIR]%'"
            } else if (filtros.tipoOperacion === 'mover') {
                query += " AND UPPER(COALESCE(t.observacion_origen, '')) NOT LIKE '[COMPARTIR]%'"
            }
        }

        if (filtros.desde) {
            query += ' AND DATE(v.fecha_solicitud) >= ?'
            params.push(filtros.desde)
        }

        if (filtros.hasta) {
            query += ' AND DATE(v.fecha_solicitud) <= ?'
            params.push(filtros.hasta)
        }

        query += ' ORDER BY v.fecha_solicitud DESC LIMIT 1000'

        let fuenteDatos = 'vw_transferencias_resumen'
        let rows = []

        try {
            const [resultado] = await connection.execute(query, params)
            rows = resultado
        } catch (error) {
            console.warn('Vista vw_transferencias_resumen no disponible, usando fallback')
            fuenteDatos = 'transferencias_stock'

            let fallbackQuery = `
                SELECT
                    t.id,
                    t.empresa_id,
                    t.numero_transferencia,
                    t.estado,
                    t.prioridad,
                    t.fecha_solicitud,
                    CASE
                        WHEN UPPER(COALESCE(t.observacion_origen, '')) LIKE '[COMPARTIR]%' THEN 'compartir'
                        ELSE 'mover'
                    END AS tipo_operacion,
                    so.nombre AS sucursal_origen,
                    sd.nombre AS sucursal_destino,
                    COUNT(td.id) AS items,
                    COALESCE(SUM(td.cantidad_enviada * td.costo_unitario), 0) AS monto_estimado
                FROM transferencias_stock t
                LEFT JOIN sucursales so ON so.id = t.sucursal_origen_id
                LEFT JOIN sucursales sd ON sd.id = t.sucursal_destino_id
                LEFT JOIN transferencias_stock_detalle td ON td.transferencia_id = t.id
                WHERE t.empresa_id = ?
            `

            const fallbackParams = [empresaId]

            if (sucursalesAsignadas.length > 0) {
                const placeholders = sucursalesAsignadas.map(() => '?').join(',')
                fallbackQuery += ` AND (t.sucursal_origen_id IN (${placeholders}) OR t.sucursal_destino_id IN (${placeholders}))`
                fallbackParams.push(...sucursalesAsignadas, ...sucursalesAsignadas)
            }

            if (filtros.buscar) {
                fallbackQuery += ` AND (
                    t.numero_transferencia LIKE ?
                    OR so.nombre LIKE ?
                    OR sd.nombre LIKE ?
                )`
                const like = `%${filtros.buscar}%`
                fallbackParams.push(like, like, like)
            }

            if (filtros.estado) {
                fallbackQuery += ' AND t.estado = ?'
                fallbackParams.push(filtros.estado)
            }

            if (filtros.prioridad) {
                fallbackQuery += ' AND t.prioridad = ?'
                fallbackParams.push(filtros.prioridad)
            }

            if (filtros.tipoOperacion) {
                if (filtros.tipoOperacion === 'compartir') {
                    fallbackQuery += " AND UPPER(COALESCE(t.observacion_origen, '')) LIKE '[COMPARTIR]%'"
                } else if (filtros.tipoOperacion === 'mover') {
                    fallbackQuery += " AND UPPER(COALESCE(t.observacion_origen, '')) NOT LIKE '[COMPARTIR]%'"
                }
            }

            if (filtros.desde) {
                fallbackQuery += ' AND DATE(t.fecha_solicitud) >= ?'
                fallbackParams.push(filtros.desde)
            }

            if (filtros.hasta) {
                fallbackQuery += ' AND DATE(t.fecha_solicitud) <= ?'
                fallbackParams.push(filtros.hasta)
            }

            fallbackQuery += `
                GROUP BY
                    t.id,
                    t.empresa_id,
                    t.numero_transferencia,
                    t.estado,
                    t.prioridad,
                    t.fecha_solicitud,
                    so.nombre,
                    sd.nombre
                ORDER BY t.fecha_solicitud DESC
                LIMIT 1000
            `

            const [fallbackRows] = await connection.execute(fallbackQuery, fallbackParams)
            rows = fallbackRows
        }

        connection.release()

        return {
            success: true,
            transferencias: rows,
            fuenteDatos
        }
    } catch (error) {
        console.error('Error al obtener reporte de transferencias:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar reportes de transferencias' }
    }
}
