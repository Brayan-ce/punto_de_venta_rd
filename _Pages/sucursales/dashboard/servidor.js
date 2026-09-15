"use server"

import db from '@/_DB/db'
import { cookies } from 'next/headers'

export async function obtenerResumenSucursales() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!empresaId || !userId || userTipo !== 'sucursales') {
            return { success: false, mensaje: 'Sesion invalida' }
        }

        connection = await db.getConnection()

        let sucursalesActivas = 0
        try {
            const [[sucursales]] = await connection.execute(
                `SELECT COUNT(*) AS total
                 FROM sucursales
                 WHERE empresa_id = ? AND activa = TRUE`,
                [empresaId]
            )
            sucursalesActivas = Number(sucursales?.total || 0)
        } catch (error) {
            console.warn('No se pudo consultar sucursales:', error?.message)
        }

        if (sucursalesActivas === 0) {
            try {
                const [[asignadas]] = await connection.execute(
                    `SELECT COUNT(DISTINCT us.sucursal_id) AS total
                     FROM usuarios_sucursales us
                     WHERE us.empresa_id = ?
                       AND us.usuario_id = ?
                       AND us.activo = TRUE`,
                    [empresaId, userId]
                )
                sucursalesActivas = Number(asignadas?.total || 0)
            } catch (error) {
                console.warn('No se pudo consultar usuarios_sucursales:', error?.message)
            }
        }

        if (sucursalesActivas === 0) {
            // Fallback minimo para no dejar dashboard completamente en cero.
            sucursalesActivas = 1
        }

        let transferenciasPendientes = 0
        try {
            const [[pendientes]] = await connection.execute(
                `SELECT COUNT(*) AS total
                 FROM transferencias_stock
                 WHERE empresa_id = ?
                   AND estado IN ('pendiente','aprobada','en_transito')`,
                [empresaId]
            )
            transferenciasPendientes = Number(pendientes?.total || 0)
        } catch (error) {
            console.warn('No se pudo consultar transferencias_stock:', error?.message)
        }

        let stockBajo = 0
        let fuenteStockBajo = 'stock_sucursal'
        try {
            const [[stockSucursal]] = await connection.execute(
                `SELECT COUNT(*) AS total
                 FROM stock_sucursal
                 WHERE empresa_id = ?
                   AND stock_actual <= stock_minimo`,
                [empresaId]
            )
            stockBajo = Number(stockSucursal?.total || 0)
        } catch (error) {
            console.warn('No se pudo consultar stock_sucursal:', error?.message)
        }

        if (stockBajo === 0) {
            try {
                const [[stockProductos]] = await connection.execute(
                    `SELECT COUNT(*) AS total
                     FROM productos
                     WHERE empresa_id = ?
                       AND activo = TRUE
                       AND COALESCE(stock, 0) <= COALESCE(stock_minimo, 0)`,
                    [empresaId]
                )
                stockBajo = Number(stockProductos?.total || 0)
                fuenteStockBajo = 'productos'
            } catch (error) {
                console.warn('No se pudo consultar productos para stock bajo:', error?.message)
            }
        }

        let movimientosHoy = 0
        let fuenteMovimientos = 'movimientos_stock_sucursal'
        try {
            const [[movsSucursal]] = await connection.execute(
                `SELECT COUNT(*) AS total
                 FROM movimientos_stock_sucursal
                 WHERE empresa_id = ?
                   AND DATE(fecha_creacion) = CURDATE()`,
                [empresaId]
            )
            movimientosHoy = Number(movsSucursal?.total || 0)
        } catch (error) {
            console.warn('No se pudo consultar movimientos_stock_sucursal:', error?.message)
        }

        if (movimientosHoy === 0) {
            try {
                const [[movsInventario]] = await connection.execute(
                    `SELECT COUNT(*) AS total
                     FROM movimientos_inventario
                     WHERE empresa_id = ?
                       AND DATE(fecha_movimiento) = CURDATE()`,
                    [empresaId]
                )
                movimientosHoy = Number(movsInventario?.total || 0)
                fuenteMovimientos = 'movimientos_inventario'
            } catch (error) {
                console.warn('No se pudo consultar movimientos_inventario:', error?.message)
            }
        }

        connection.release()

        return {
            success: true,
            fuentes: {
                stockBajo: fuenteStockBajo,
                movimientosHoy: fuenteMovimientos
            },
            resumen: {
                sucursales: sucursalesActivas,
                transferenciasPendientes,
                stockBajo,
                movimientosHoy
            }
        }
    } catch (error) {
        console.error('Error al obtener resumen de sucursales:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar dashboard' }
    }
}
