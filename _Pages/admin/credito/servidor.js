"use server"

import { cookies } from 'next/headers'
import db from '@/_DB/db'

// ============================================
// ESTADÍSTICAS GENERALES DEL DASHBOARD
// ============================================

export async function obtenerEstadisticasCredito() {
    let connection

    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()

        // Total clientes con crédito activo
        const [clientesRes] = await connection.execute(
            `SELECT COUNT(*) as total FROM credito_clientes WHERE empresa_id = ? AND activo = TRUE`,
            [empresaId]
        )

        // Total crédito otorgado
        const [creditoRes] = await connection.execute(
            `SELECT 
                SUM(limite_credito) as total_limite,
                SUM(saldo_utilizado) as total_utilizado,
                SUM(saldo_disponible) as total_disponible
            FROM credito_clientes 
            WHERE empresa_id = ? AND activo = TRUE`,
            [empresaId]
        )

        // Total cuentas por cobrar
        const [cxcRes] = await connection.execute(
            `SELECT 
                SUM(saldo_pendiente) as total_pendiente,
                SUM(CASE WHEN estado_cxc = 'vencida' THEN saldo_pendiente ELSE 0 END) as total_vencido,
                COUNT(*) as total_cuentas
            FROM cuentas_por_cobrar 
            WHERE empresa_id = ? AND estado_cxc IN ('activa', 'vencida', 'parcial')`,
            [empresaId]
        )

        // Alertas activas
        const [alertasRes] = await connection.execute(
            `SELECT COUNT(*) as total 
            FROM alertas_credito 
            WHERE empresa_id = ? AND estado = 'activa'`,
            [empresaId]
        )

        return {
            success: true,
            estadisticas: {
                totalClientes: clientesRes[0].total || 0,
                totalLimite: parseFloat(creditoRes[0].total_limite || 0),
                totalUtilizado: parseFloat(creditoRes[0].total_utilizado || 0),
                totalDisponible: parseFloat(creditoRes[0].total_disponible || 0),
                totalPendiente: parseFloat(cxcRes[0].total_pendiente || 0),
                totalVencido: parseFloat(cxcRes[0].total_vencido || 0),
                totalCuentas: cxcRes[0].total_cuentas || 0,
                alertasActivas: alertasRes[0].total || 0
            }
        }

    } catch (error) {
        console.error('[obtenerEstadisticasCredito]', error)
        return { success: false, mensaje: 'Error al obtener estadísticas' }
    } finally {
        if (connection) connection.release()
    }
}

// ============================================
// DISTRIBUCIÓN POR CLASIFICACIÓN
// ============================================

export async function obtenerDistribucionClasificacion() {
    let connection

    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()

        const [resultados] = await connection.execute(
            `SELECT 
                clasificacion,
                COUNT(*) as cantidad,
                SUM(limite_credito) as limite_total,
                SUM(saldo_utilizado) as utilizado_total
            FROM credito_clientes 
            WHERE empresa_id = ? AND activo = TRUE
            GROUP BY clasificacion
            ORDER BY FIELD(clasificacion, 'A', 'B', 'C', 'D')`,
            [empresaId]
        )

        return {
            success: true,
            distribucion: resultados.map(r => ({
                clasificacion: r.clasificacion,
                cantidad: r.cantidad,
                limiteTotal: parseFloat(r.limite_total || 0),
                utilizadoTotal: parseFloat(r.utilizado_total || 0)
            }))
        }

    } catch (error) {
        console.error('[obtenerDistribucionClasificacion]', error)
        return { success: false, mensaje: 'Error al obtener distribución' }
    } finally {
        if (connection) connection.release()
    }
}

// ============================================
// PRÓXIMOS VENCIMIENTOS (7 días)
// ============================================

export async function obtenerProximosVencimientos() {
    let connection

    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()

        const [resultados] = await connection.execute(
            `SELECT 
                cxc.id,
                cxc.numero_documento,
                cxc.fecha_vencimiento,
                cxc.saldo_pendiente,
                CONCAT(c.nombre, ' ', IFNULL(c.apellidos, '')) as cliente_nombre,
                c.numero_documento as cliente_doc,
                DATEDIFF(cxc.fecha_vencimiento, CURDATE()) as dias_restantes
            FROM cuentas_por_cobrar cxc
            INNER JOIN clientes c ON c.id = cxc.cliente_id
            WHERE cxc.empresa_id = ? 
            AND cxc.estado_cxc IN ('activa', 'parcial')
            AND cxc.fecha_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
            ORDER BY cxc.fecha_vencimiento ASC
            LIMIT 10`,
            [empresaId]
        )

        return {
            success: true,
            vencimientos: resultados.map(v => ({
                id: v.id,
                numeroDocumento: v.numero_documento,
                fechaVencimiento: v.fecha_vencimiento,
                saldoPendiente: parseFloat(v.saldo_pendiente),
                clienteNombre: v.cliente_nombre,
                clienteDoc: v.cliente_doc,
                diasRestantes: v.dias_restantes
            }))
        }

    } catch (error) {
        console.error('[obtenerProximosVencimientos]', error)
        return { success: false, mensaje: 'Error al obtener vencimientos' }
    } finally {
        if (connection) connection.release()
    }
}

// ============================================
// CLIENTES CON MAL COMPORTAMIENTO
// ============================================

export async function obtenerClientesEnRiesgo() {
    let connection

    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()

        const [resultados] = await connection.execute(
            `SELECT 
                cc.id,
                CONCAT(c.nombre, ' ', IFNULL(c.apellidos, '')) as nombre_completo,
                c.numero_documento,
                cc.clasificacion,
                cc.score_crediticio,
                cc.estado_credito,
                cc.saldo_utilizado,
                cc.limite_credito,
                cc.total_creditos_vencidos
            FROM credito_clientes cc
            INNER JOIN clientes c ON c.id = cc.cliente_id
            WHERE cc.empresa_id = ? 
            AND cc.activo = TRUE
            AND (cc.clasificacion IN ('C', 'D') OR cc.estado_credito IN ('atrasado', 'bloqueado'))
            ORDER BY cc.score_crediticio ASC, cc.total_creditos_vencidos DESC
            LIMIT 10`,
            [empresaId]
        )

        return {
            success: true,
            clientes: resultados
        }

    } catch (error) {
        console.error('[obtenerClientesEnRiesgo]', error)
        return { success: false, mensaje: 'Error al obtener clientes en riesgo' }
    } finally {
        if (connection) connection.release()
    }
}
