"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

/**
 * Obtiene datos del dashboard de activos
 * @returns {Object} { success: boolean, estadisticas?: Object, activosRecientes?: Array, datosFinanciamiento?: Object }
 */
export async function obtenerDashboardActivos() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return {
                success: false,
                mensaje: 'Sesión inválida'
            }
        }

        connection = await db.getConnection()

        // Estadísticas generales
        const [stats] = await connection.execute(
            `SELECT 
                COUNT(*) as total_activos,
                COUNT(CASE WHEN estado = 'en_stock' THEN 1 END) as activos_en_stock,
                COUNT(CASE WHEN estado = 'financiado' THEN 1 END) as activos_financiados,
                COUNT(CASE WHEN estado = 'vendido' THEN 1 END) as activos_vendidos,
                COUNT(CASE WHEN estado = 'asignado' THEN 1 END) as activos_asignados,
                COUNT(CASE WHEN estado = 'devuelto' THEN 1 END) as activos_devueltos,
                COUNT(CASE WHEN estado = 'mantenimiento' THEN 1 END) as activos_mantenimiento,
                COUNT(CASE WHEN estado = 'dado_baja' THEN 1 END) as activos_dado_baja,
                SUM(CASE WHEN estado = 'en_stock' THEN precio_compra ELSE 0 END) as valor_inventario,
                SUM(precio_compra) as total_inversion,
                SUM(precio_venta) as total_ventas
            FROM activos_productos
            WHERE empresa_id = ?`,
            [empresaId]
        )

        // Activos más recientes (últimos 6)
        const [activosRecientes] = await connection.execute(
            `SELECT 
                a.id,
                a.numero_serie,
                a.vin,
                a.numero_placa,
                a.estado,
                a.fecha_creacion,
                a.precio_compra,
                a.precio_venta,
                p.nombre as producto_nombre,
                p.imagen_url as producto_imagen_url,
                p.sku as producto_sku,
                p.tipo_activo,
                c.nombre as categoria_nombre,
                cl.nombre as cliente_nombre,
                cl.apellidos as cliente_apellidos
            FROM activos_productos a
            LEFT JOIN productos p ON a.producto_id = p.id
            LEFT JOIN categorias c ON p.categoria_id = c.id
            LEFT JOIN clientes cl ON a.cliente_id = cl.id
            WHERE a.empresa_id = ?
            ORDER BY a.fecha_creacion DESC
            LIMIT 6`,
            [empresaId]
        )

        // Activos destacados (con más valor o recientes)
        const [activosDestacados] = await connection.execute(
            `SELECT 
                a.id,
                a.numero_serie,
                a.vin,
                a.numero_placa,
                a.estado,
                a.precio_compra,
                a.precio_venta,
                p.nombre as producto_nombre,
                p.imagen_url as producto_imagen_url,
                p.sku as producto_sku,
                p.tipo_activo,
                c.nombre as categoria_nombre
            FROM activos_productos a
            LEFT JOIN productos p ON a.producto_id = p.id
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE a.empresa_id = ? AND a.estado = 'en_stock'
            ORDER BY a.precio_compra DESC, a.fecha_creacion DESC
            LIMIT 6`,
            [empresaId]
        )

        // Datos de financiamiento
        let datosFinanciamiento = {
            contratos_activos: 0,
            cuotas_pendientes: 0,
            cuotas_vencidas: 0,
            monto_por_cobrar: 0,
            contratos_recientes: []
        }

        // Verificar si existen las tablas de financiamiento
        const [tablasExisten] = await connection.execute(
            `SELECT COUNT(*) as existe FROM information_schema.tables 
            WHERE table_schema = DATABASE() 
            AND table_name = 'contratos_financiamiento'`
        )

        if (tablasExisten[0].existe > 0) {
            // Estadísticas de contratos
            const [statsContratos] = await connection.execute(
                `SELECT 
                    COUNT(DISTINCT cf.id) as contratos_activos,
                    SUM(cf.saldo_pendiente) as monto_por_cobrar,
                    (SELECT COUNT(*) FROM cuotas_financiamiento WHERE empresa_id = ? AND estado = 'pendiente') as cuotas_pendientes,
                    (SELECT COUNT(*) FROM cuotas_financiamiento WHERE empresa_id = ? AND estado = 'vencida') as cuotas_vencidas
                FROM contratos_financiamiento cf
                WHERE cf.empresa_id = ? AND cf.estado = 'activo'`,
                [empresaId, empresaId, empresaId]
            )

            // Contratos recientes
            const [contratosRecientes] = await connection.execute(
                `SELECT 
                    cf.id,
                    cf.numero_contrato,
                    cf.monto_financiado,
                    cf.saldo_pendiente,
                    cf.estado,
                    cf.fecha_contrato,
                    CONCAT(c.nombre, ' ', COALESCE(c.apellidos, '')) as cliente_nombre
                FROM contratos_financiamiento cf
                INNER JOIN clientes c ON cf.cliente_id = c.id
                WHERE cf.empresa_id = ? AND cf.estado IN ('activo', 'incumplido')
                ORDER BY cf.fecha_creacion DESC
                LIMIT 5`,
                [empresaId]
            )

            datosFinanciamiento = {
                contratos_activos: statsContratos[0]?.contratos_activos || 0,
                cuotas_pendientes: statsContratos[0]?.cuotas_pendientes || 0,
                cuotas_vencidas: statsContratos[0]?.cuotas_vencidas || 0,
                monto_por_cobrar: statsContratos[0]?.monto_por_cobrar || 0,
                contratos_recientes: contratosRecientes
            }
        }

        connection.release()

        return {
            success: true,
            estadisticas: stats[0],
            activosRecientes: activosRecientes,
            activosDestacados: activosDestacados,
            datosFinanciamiento: datosFinanciamiento,
            userTipo: userTipo
        }

    } catch (error) {
        console.error('Error al obtener dashboard de activos:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar dashboard'
        }
    }
}

/**
 * Obtiene la lista de activos rastreables con filtros
 * @param {Object} filtros - Filtros de búsqueda
 * @returns {Object} { success: boolean, activos: Array, mensaje?: string }
 */
export async function obtenerActivos(filtros = {}) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        let query = `
            SELECT a.*,
                   p.nombre as producto_nombre,
                   p.sku as producto_sku,
                   p.imagen_url as producto_imagen_url,
                   p.tipo_activo,
                   cl.nombre as cliente_nombre,
                   cl.apellidos as cliente_apellidos,
                   cl.numero_documento as cliente_documento,
                   cl.telefono as cliente_telefono,
                   c.numero_contrato,
                   c.saldo_pendiente as contrato_saldo_pendiente
            FROM activos_productos a
            LEFT JOIN productos p ON a.producto_id = p.id
            LEFT JOIN clientes cl ON a.cliente_id = cl.id
            LEFT JOIN contratos_financiamiento c ON a.contrato_financiamiento_id = c.id
            WHERE a.empresa_id = ?
        `
        const params = [empresaId]

        // Filtro por estado
        if (filtros.estado) {
            query += ` AND a.estado = ?`
            params.push(filtros.estado)
        }

        // Filtro por producto
        if (filtros.producto_id) {
            query += ` AND a.producto_id = ?`
            params.push(filtros.producto_id)
        }

        // Filtro por cliente
        if (filtros.cliente_id) {
            query += ` AND a.cliente_id = ?`
            params.push(filtros.cliente_id)
        }

        // Filtro por contrato
        if (filtros.contrato_id) {
            query += ` AND a.contrato_financiamiento_id = ?`
            params.push(filtros.contrato_id)
        }

        // Búsqueda por número de serie, VIN, código o placa
        if (filtros.buscar) {
            query += ` AND (
                a.numero_serie LIKE ? OR 
                a.vin LIKE ? OR 
                a.codigo_activo LIKE ? OR 
                a.numero_placa LIKE ? OR
                p.nombre LIKE ? OR
                cl.nombre LIKE ?
            )`
            const busqueda = `%${filtros.buscar}%`
            params.push(busqueda, busqueda, busqueda, busqueda, busqueda, busqueda)
        }

        query += ` ORDER BY a.fecha_creacion DESC LIMIT 200`

        const [activos] = await connection.execute(query, params)

        connection.release()

        return { success: true, activos }

    } catch (error) {
        console.error('Error al obtener activos:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar activos', activos: [] }
    }
}

/**
 * Obtiene estadísticas de activos
 * @param {Object} filtros - Filtros opcionales
 * @returns {Object} { success: boolean, estadisticas?: Object, mensaje?: string }
 */
export async function obtenerEstadisticasActivos(filtros = {}) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        let whereClause = 'WHERE a.empresa_id = ?'
        const params = [empresaId]

        if (filtros.fecha_desde) {
            whereClause += ' AND a.fecha_creacion >= ?'
            params.push(filtros.fecha_desde)
        }

        if (filtros.fecha_hasta) {
            whereClause += ' AND a.fecha_creacion <= ?'
            params.push(filtros.fecha_hasta)
        }

        // Estadísticas generales
        const [estadisticas] = await connection.execute(
            `SELECT 
                COUNT(*) as total_activos,
                SUM(CASE WHEN a.estado = 'en_stock' THEN 1 ELSE 0 END) as activos_en_stock,
                SUM(CASE WHEN a.estado = 'vendido' THEN 1 ELSE 0 END) as activos_vendidos,
                SUM(CASE WHEN a.estado = 'financiado' THEN 1 ELSE 0 END) as activos_financiados,
                SUM(CASE WHEN a.estado = 'asignado' THEN 1 ELSE 0 END) as activos_asignados,
                SUM(CASE WHEN a.estado = 'devuelto' THEN 1 ELSE 0 END) as activos_devueltos,
                SUM(CASE WHEN a.estado = 'mantenimiento' THEN 1 ELSE 0 END) as activos_mantenimiento,
                SUM(CASE WHEN a.estado = 'dado_baja' THEN 1 ELSE 0 END) as activos_dado_baja,
                SUM(a.precio_compra) as total_inversion,
                SUM(a.precio_venta) as total_ventas
             FROM activos_productos a
             ${whereClause}`,
            params
        )

        connection.release()

        return {
            success: true,
            estadisticas: estadisticas[0]
        }

    } catch (error) {
        console.error('Error al obtener estadísticas:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar estadísticas' }
    }
}

/**
 * Elimina (da de baja) un activo
 * @param {number} activoId - ID del activo
 * @returns {Object} { success: boolean, mensaje?: string }
 */
export async function eliminarActivo(activoId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para eliminar activos'
            }
        }

        connection = await db.getConnection()

        // Verificar estado del activo
        const [activo] = await connection.execute(
            `SELECT estado FROM activos_productos WHERE id = ? AND empresa_id = ?`,
            [activoId, empresaId]
        )

        if (activo.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Activo no encontrado'
            }
        }

        // No permitir eliminar activos financiados o vendidos
        if (activo[0].estado === 'financiado' || activo[0].estado === 'vendido') {
            connection.release()
            return {
                success: false,
                mensaje: `No se puede eliminar un activo con estado "${activo[0].estado}"`
            }
        }

        // Cambiar estado a 'dado_baja' en lugar de eliminar físicamente
        await connection.execute(
            `UPDATE activos_productos SET estado = 'dado_baja', modificado_por = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ? AND empresa_id = ?`,
            [userId, activoId, empresaId]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Activo dado de baja exitosamente'
        }

    } catch (error) {
        console.error('Error al eliminar activo:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al eliminar el activo'
        }
    }
}

