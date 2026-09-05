"use server"
import db from "@/_DB/db"
import { cookies } from 'next/headers'

async function getEmpresaId() {
    const cookieStore = await cookies()
    return cookieStore.get('empresaId')?.value
}

export async function obtenerAlertas(filtros = {}) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, alertas: [] }

        connection = await db.getConnection()

        let where = `a.empresa_id = ?`
        const params = [empresaId]

        if (filtros.estado && filtros.estado !== 'todos') {
            where += ` AND a.estado = ?`
            params.push(filtros.estado)
        }
        if (filtros.tipo && filtros.tipo !== 'todos') {
            where += ` AND a.tipo = ?`
            params.push(filtros.tipo)
        }
        if (filtros.busqueda) {
            where += ` AND (a.mensaje LIKE ? OR c.numero LIKE ? OR cl.nombre LIKE ? OR cl.apellidos LIKE ?)`
            const b = `%${filtros.busqueda}%`
            params.push(b, b, b, b)
        }

        const [alertas] = await connection.execute(
            `SELECT
                a.id,
                a.tipo,
                a.mensaje,
                a.estado,
                a.fecha,
                a.contrato_id,
                a.cuota_id,
                c.numero        AS contrato_numero,
                c.estado        AS contrato_estado,
                c.saldo_pendiente,
                c.cuota_mensual,
                c.fecha_fin,
                cl.id           AS cliente_id,
                CONCAT(cl.nombre, IFNULL(CONCAT(' ', cl.apellidos), '')) AS cliente_nombre,
                cl.telefono     AS cliente_telefono,
                p.nombre        AS plan_nombre,
                cu.numero       AS cuota_numero,
                cu.monto        AS cuota_monto,
                cu.fecha_vencimiento,
                cu.estado       AS cuota_estado,
                cu.mora         AS cuota_mora
            FROM fin_alertas a
            LEFT JOIN fin_contratos  c  ON a.contrato_id = c.id
            LEFT JOIN clientes       cl ON c.cliente_id  = cl.id
            LEFT JOIN fin_planes     p  ON c.plan_id     = p.id
            LEFT JOIN fin_cuotas     cu ON a.cuota_id    = cu.id
            WHERE ${where}
            ORDER BY
                CASE a.estado WHEN 'activa' THEN 0 ELSE 1 END,
                a.fecha DESC`,
            params
        )

        const [stats] = await connection.execute(
            `SELECT
                COUNT(*)                              AS total,
                SUM(estado = 'activa')                AS activas,
                SUM(estado = 'resuelta')              AS resueltas,
                SUM(estado = 'descartada')            AS descartadas,
                SUM(tipo = 'vencimiento')             AS vencimiento,
                SUM(tipo = 'mora')                    AS mora,
                SUM(tipo = 'incumplimiento')          AS incumplimiento,
                SUM(tipo = 'otro')                    AS otro
            FROM fin_alertas
            WHERE empresa_id = ?`,
            [empresaId]
        )

        connection.release()
        return { success: true, alertas, stats: stats[0] }
    } catch (error) {
        console.error('obtenerAlertas:', error)
        if (connection) connection.release()
        return { success: false, alertas: [], stats: {} }
    }
}

export async function cambiarEstadoAlerta(id, estado) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()
        await connection.execute(
            `UPDATE fin_alertas SET estado = ? WHERE id = ? AND empresa_id = ?`,
            [estado, id, empresaId]
        )
        connection.release()
        return { success: true }
    } catch (error) {
        console.error('cambiarEstadoAlerta:', error)
        if (connection) connection.release()
        return { success: false, mensaje: error.message }
    }
}

export async function eliminarAlerta(id) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()
        await connection.execute(
            `DELETE FROM fin_alertas WHERE id = ? AND empresa_id = ?`,
            [id, empresaId]
        )
        connection.release()
        return { success: true }
    } catch (error) {
        console.error('eliminarAlerta:', error)
        if (connection) connection.release()
        return { success: false, mensaje: error.message }
    }
}

export async function crearAlertaManual(datos) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesion invalida' }

        if (!datos.mensaje?.trim()) return { success: false, mensaje: 'El mensaje es requerido' }
        if (!datos.tipo)            return { success: false, mensaje: 'El tipo es requerido' }

        connection = await db.getConnection()
        await connection.execute(
            `INSERT INTO fin_alertas (empresa_id, contrato_id, cuota_id, tipo, mensaje, estado)
             VALUES (?, ?, ?, ?, ?, 'activa')`,
            [
                empresaId,
                datos.contrato_id || null,
                datos.cuota_id    || null,
                datos.tipo,
                datos.mensaje.trim()
            ]
        )
        connection.release()
        return { success: true, mensaje: 'Alerta creada' }
    } catch (error) {
        console.error('crearAlertaManual:', error)
        if (connection) connection.release()
        return { success: false, mensaje: error.message }
    }
}

export async function generarAlertasAutomaticas() {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()
        await connection.beginTransaction()

        try {
            const hoy = new Date().toISOString().split('T')[0]
            const en3dias = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]

            const [cuotasVencidas] = await connection.execute(
                `SELECT cu.id AS cuota_id, cu.contrato_id, cu.numero, cu.monto, cu.fecha_vencimiento,
                        c.numero AS contrato_numero
                 FROM fin_cuotas cu
                 JOIN fin_contratos c ON cu.contrato_id = c.id
                 WHERE c.empresa_id = ? AND cu.estado IN ('pendiente','parcial')
                   AND cu.fecha_vencimiento < ?
                   AND NOT EXISTS (
                       SELECT 1 FROM fin_alertas fa
                       WHERE fa.cuota_id = cu.id AND fa.tipo = 'mora' AND fa.empresa_id = ?
                   )`,
                [empresaId, hoy, empresaId]
            )

            for (const cu of cuotasVencidas) {
                await connection.execute(
                    `UPDATE fin_cuotas SET estado = 'vencida' WHERE id = ?`,
                    [cu.cuota_id]
                )
                await connection.execute(
                    `INSERT INTO fin_alertas (empresa_id, contrato_id, cuota_id, tipo, mensaje, estado)
                     VALUES (?, ?, ?, 'mora', ?, 'activa')`,
                    [empresaId, cu.contrato_id, cu.cuota_id,
                     `Cuota #${cu.numero} del contrato ${cu.contrato_numero} vencio sin pagar`]
                )
            }

            const [cuotasProximas] = await connection.execute(
                `SELECT cu.id AS cuota_id, cu.contrato_id, cu.numero, cu.fecha_vencimiento,
                        c.numero AS contrato_numero
                 FROM fin_cuotas cu
                 JOIN fin_contratos c ON cu.contrato_id = c.id
                 WHERE c.empresa_id = ? AND cu.estado = 'pendiente'
                   AND cu.fecha_vencimiento BETWEEN ? AND ?
                   AND NOT EXISTS (
                       SELECT 1 FROM fin_alertas fa
                       WHERE fa.cuota_id = cu.id AND fa.tipo = 'vencimiento' AND fa.empresa_id = ?
                   )`,
                [empresaId, hoy, en3dias, empresaId]
            )

            for (const cu of cuotasProximas) {
                await connection.execute(
                    `INSERT INTO fin_alertas (empresa_id, contrato_id, cuota_id, tipo, mensaje, estado)
                     VALUES (?, ?, ?, 'vencimiento', ?, 'activa')`,
                    [empresaId, cu.contrato_id, cu.cuota_id,
                     `Cuota #${cu.numero} del contrato ${cu.contrato_numero} vence el ${cu.fecha_vencimiento}`]
                )
            }

            const [contratosIncumplidos] = await connection.execute(
                `SELECT c.id AS contrato_id, c.numero
                 FROM fin_contratos c
                 WHERE c.empresa_id = ? AND c.estado = 'activo'
                   AND (SELECT COUNT(*) FROM fin_cuotas WHERE contrato_id = c.id AND estado = 'vencida') >= 3
                   AND NOT EXISTS (
                       SELECT 1 FROM fin_alertas fa
                       WHERE fa.contrato_id = c.id AND fa.tipo = 'incumplimiento'
                         AND fa.estado = 'activa' AND fa.empresa_id = ?
                   )`,
                [empresaId, empresaId]
            )

            for (const ct of contratosIncumplidos) {
                await connection.execute(
                    `UPDATE fin_contratos SET estado = 'incumplido' WHERE id = ?`,
                    [ct.contrato_id]
                )
                await connection.execute(
                    `INSERT INTO fin_alertas (empresa_id, contrato_id, tipo, mensaje, estado)
                     VALUES (?, ?, 'incumplimiento', ?, 'activa')`,
                    [empresaId, ct.contrato_id,
                     `Contrato ${ct.numero} tiene 3 o mas cuotas vencidas y fue marcado como incumplido`]
                )
            }

            await connection.commit()
            connection.release()
            return {
                success: true,
                mensaje: `Proceso completado: ${cuotasVencidas.length} mora(s), ${cuotasProximas.length} proximo(s), ${contratosIncumplidos.length} incumplimiento(s)`
            }
        } catch (err) {
            await connection.rollback()
            throw err
        }
    } catch (error) {
        console.error('generarAlertasAutomaticas:', error)
        if (connection) { try { await connection.rollback() } catch {} connection.release() }
        return { success: false, mensaje: error.message }
    }
}

export async function obtenerContratosParaAlerta() {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, contratos: [] }

        connection = await db.getConnection()
        const [contratos] = await connection.execute(
            `SELECT c.id, c.numero,
                    CONCAT(cl.nombre, IFNULL(CONCAT(' ', cl.apellidos), '')) AS cliente_nombre
             FROM fin_contratos c
             JOIN clientes cl ON c.cliente_id = cl.id
             WHERE c.empresa_id = ? AND c.estado = 'activo'
             ORDER BY c.numero ASC`,
            [empresaId]
        )
        connection.release()
        return { success: true, contratos }
    } catch (error) {
        if (connection) connection.release()
        return { success: false, contratos: [] }
    }
}

export async function obtenerDatosEmpresa() {
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        const connection = await db.getConnection()
        const [rows] = await connection.query(
            'SELECT moneda, simbolo_moneda, impuesto_porcentaje, nombre_empresa FROM empresas WHERE id = ? LIMIT 1',
            [empresaId]
        )
        connection.release()

        const e = rows[0]
        return {
            success: true,
            empresa: {
                moneda: e?.moneda || 'DOP',
                simbolo_moneda: e?.simbolo_moneda || 'RD$',
                locale: e?.moneda === 'USD' ? 'en-US' : 'es-DO',
                itbis_incluido: true,
                nombre: e?.nombre_empresa || '',
            }
        }
    } catch (error) {
        console.error('Error al obtener datos empresa:', error)
        return { success: false, mensaje: 'Error al obtener datos de la empresa' }
    }
}