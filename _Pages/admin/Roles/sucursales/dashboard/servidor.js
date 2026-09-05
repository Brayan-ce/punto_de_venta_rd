"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

async function obtenerSucursalesAsignadas(connection, empresaId, userId) {
    try {
        const [asignaciones] = await connection.execute(
            `SELECT DISTINCT sucursal_id
             FROM usuarios_sucursales
             WHERE usuario_id = ? AND empresa_id = ? AND activo = TRUE`,
            [userId, empresaId]
        )

        return asignaciones.map((item) => Number(item.sucursal_id))
    } catch (error) {
        console.warn('Tabla usuarios_sucursales no encontrada en dashboard')
        return []
    }
}

export async function obtenerResumenSucursales() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()
        const fuentes = {}

        const sucursalesAsignadas = await obtenerSucursalesAsignadas(connection, empresaId, userId)

        // 1. SUCURSALES
        let sucursales = 0
        let querySucursales = `
            SELECT COUNT(*) AS total
            FROM sucursales
            WHERE empresa_id = ? AND activa = TRUE
        `
        const paramsSucursales = [empresaId]

        if (sucursalesAsignadas.length > 0) {
            const placeholders = sucursalesAsignadas.map(() => '?').join(',')
            querySucursales += ` AND id IN (${placeholders})`
            paramsSucursales.push(...sucursalesAsignadas)
        }

        const [[resultSucursales]] = await connection.execute(querySucursales, paramsSucursales)
        sucursales = Number(resultSucursales?.total || 0)

        // 2. TRANSFERENCIAS PENDIENTES
        let transferenciasPendientes = 0
        try {
            let queryTransferencias = `
                SELECT COUNT(*) as total
                FROM transferencias_stock
                WHERE empresa_id = ? AND estado = 'pendiente'
            `
            const paramsTransferencias = [empresaId]

            if (sucursalesAsignadas.length > 0) {
                const placeholders = sucursalesAsignadas.map(() => '?').join(',')
                queryTransferencias += ` AND (sucursal_origen_id IN (${placeholders}) OR sucursal_destino_id IN (${placeholders}))`
                paramsTransferencias.push(...sucursalesAsignadas, ...sucursalesAsignadas)
            }

            const [[result]] = await connection.execute(queryTransferencias, paramsTransferencias)
            transferenciasPendientes = Number(result?.total || 0)
        } catch (error) {
            console.warn('Tabla transferencias_stock no encontrada')
        }

        // 3. STOCK BAJO
        let stockBajo = 0
        try {
            let queryTotalStock = `SELECT COUNT(*) AS total FROM stock_sucursal WHERE empresa_id = ?`
            const paramsTotalStock = [empresaId]

            if (sucursalesAsignadas.length > 0) {
                const placeholders = sucursalesAsignadas.map(() => '?').join(',')
                queryTotalStock += ` AND sucursal_id IN (${placeholders})`
                paramsTotalStock.push(...sucursalesAsignadas)
            }

            const [[result]] = await connection.execute(queryTotalStock, paramsTotalStock)
            if (Number(result?.total || 0) === 0) {
                // Fallback a productos
                fuentes.stockBajo = 'fallback'
                const [[productosResult]] = await connection.execute(
                    `SELECT COUNT(*) FROM productos WHERE empresa_id = ? AND activo = TRUE 
                     AND COALESCE(stock, 0) <= COALESCE(stock_minimo, 0)`,
                    [empresaId]
                )
                stockBajo = Number(productosResult?.['COUNT(*)'] || 0)
            } else {
                fuentes.stockBajo = 'stock_sucursal'
                let queryStockBajo = `
                    SELECT COUNT(*) AS total
                    FROM stock_sucursal
                    WHERE empresa_id = ? AND stock_actual <= stock_minimo
                `
                const paramsStockBajo = [empresaId]

                if (sucursalesAsignadas.length > 0) {
                    const placeholders = sucursalesAsignadas.map(() => '?').join(',')
                    queryStockBajo += ` AND sucursal_id IN (${placeholders})`
                    paramsStockBajo.push(...sucursalesAsignadas)
                }

                const [[countResult]] = await connection.execute(queryStockBajo, paramsStockBajo)
                stockBajo = Number(countResult?.total || 0)
            }
        } catch (error) {
            console.warn('Error consultando stock, usando fallback')
            fuentes.stockBajo = 'fallback'
            const [[productosResult]] = await connection.execute(
                `SELECT COUNT(*) FROM productos WHERE empresa_id = ? AND activo = TRUE 
                 AND COALESCE(stock, 0) <= COALESCE(stock_minimo, 0)`,
                [empresaId]
            )
            stockBajo = Number(productosResult?.['COUNT(*)'] || 0)
        }

        // 4. MOVIMIENTOS HOY
        let movimientosHoy = 0
        const hoy = new Date().toISOString().split('T')[0]
        try {
            let queryMovimientos = `
                SELECT COUNT(*) as total
                FROM movimientos_stock_sucursal
                WHERE empresa_id = ? AND DATE(fecha_creacion) = ?
            `
            const paramsMovimientos = [empresaId, hoy]

            if (sucursalesAsignadas.length > 0) {
                const placeholders = sucursalesAsignadas.map(() => '?').join(',')
                queryMovimientos += ` AND sucursal_id IN (${placeholders})`
                paramsMovimientos.push(...sucursalesAsignadas)
            }

            const [[result]] = await connection.execute(queryMovimientos, paramsMovimientos)
            if (Number(result?.total || 0) === 0) {
                // Fallback a movimientos_inventario
                fuentes.movimientosHoy = 'fallback'
                const [[fallbackResult]] = await connection.execute(
                    `SELECT COUNT(*) as total FROM movimientos_inventario 
                     WHERE empresa_id = ? AND DATE(fecha_movimiento) = ?`,
                    [empresaId, hoy]
                )
                movimientosHoy = Number(fallbackResult?.total || 0)
            } else {
                fuentes.movimientosHoy = 'movimientos_stock_sucursal'
                movimientosHoy = Number(result?.total || 0)
            }
        } catch (error) {
            console.warn('Error consultando movimientos, usando fallback')
            fuentes.movimientosHoy = 'fallback'
            const [[fallbackResult]] = await connection.execute(
                `SELECT COUNT(*) as total FROM movimientos_inventario 
                 WHERE empresa_id = ? AND DATE(fecha_movimiento) = ?`,
                [empresaId, hoy]
            )
            movimientosHoy = Number(fallbackResult?.total || 0)
        }

        connection.release()

        return {
            success: true,
            resumen: {
                sucursales,
                transferencias_pendientes: transferenciasPendientes,
                stock_bajo: stockBajo,
                movimientos_hoy: movimientosHoy
            },
            fuentes
        }

    } catch (error) {
        console.error('Error al obtener resumen:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar el dashboard' }
    }
}
