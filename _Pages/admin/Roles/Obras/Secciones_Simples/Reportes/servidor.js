"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerObrasActivas() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [obras] = await connection.execute(
            `SELECT id, codigo_obra, nombre
             FROM obras_simples
             WHERE empresa_id = ?
             ORDER BY nombre`,
            [empresaId]
        )

        connection.release()

        return {
            success: true,
            obras
        }
    } catch (error) {
        console.error('Error al obtener obras:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar las obras'
        }
    }
}

export async function obtenerReporteObra(obraId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [obra] = await connection.execute(
            `SELECT 
                nombre,
                codigo_obra,
                estado,
                presupuesto_total,
                fecha_inicio,
                fecha_fin_estimada
             FROM obras_simples
             WHERE id = ? AND empresa_id = ?`,
            [obraId, empresaId]
        )

        if (obra.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Obra no encontrada'
            }
        }

        const [totales] = await connection.execute(
            `SELECT 
                COALESCE(SUM(gos.monto), 0) as total_gastos,
                COUNT(DISTINCT aos.trabajador_id) as total_trabajadores,
                COUNT(DISTINCT ass.fecha) as dias_trabajados,
                COALESCE(SUM(ass.horas_trabajadas), 0) as total_horas
             FROM obras_simples os
             LEFT JOIN gastos_obra_simple gos ON os.id = gos.obra_id
             LEFT JOIN asignaciones_obra_simple aos ON os.id = aos.obra_id AND aos.activo = TRUE
             LEFT JOIN asistencias_simple ass ON os.id = ass.obra_id AND ass.presente = TRUE
             WHERE os.id = ?`,
            [obraId]
        )

        const [trabajadores] = await connection.execute(
            `SELECT 
                ts.nombre,
                ts.apellido,
                ts.especialidad,
                COUNT(DISTINCT ass.fecha) as dias_trabajados,
                COALESCE(SUM(ass.horas_trabajadas), 0) as horas_trabajadas,
                COALESCE(SUM(ass.monto_pagar), 0) as monto_total
             FROM trabajadores_simples ts
             INNER JOIN asignaciones_obra_simple aos ON ts.id = aos.trabajador_id
             LEFT JOIN asistencias_simple ass ON ts.id = ass.trabajador_id AND ass.obra_id = ?
             WHERE aos.obra_id = ? AND aos.activo = TRUE
             GROUP BY ts.id
             ORDER BY monto_total DESC`,
            [obraId, obraId]
        )

        const [gastosTipo] = await connection.execute(
            `SELECT 
                tipo_gasto,
                COALESCE(SUM(monto), 0) as total
             FROM gastos_obra_simple
             WHERE obra_id = ?
             GROUP BY tipo_gasto
             ORDER BY total DESC`,
            [obraId]
        )

        connection.release()

        return {
            success: true,
            datos: {
                obra: obra[0],
                totales: totales[0],
                trabajadores,
                gastos_tipo: gastosTipo
            }
        }
    } catch (error) {
        console.error('Error al obtener reporte de obra:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al generar el reporte'
        }
    }
}

export async function obtenerReporteAsistencias(obraId, fechaInicio, fechaFin) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        let sql = `
            SELECT 
                ass.fecha,
                ts.nombre,
                ts.apellido,
                ass.presente,
                ass.horas_trabajadas,
                ass.monto_pagar,
                ass.observaciones
             FROM asistencias_simple ass
             INNER JOIN trabajadores_simples ts ON ass.trabajador_id = ts.id
             WHERE ass.obra_id = ?
        `

        const params = [obraId]

        if (fechaInicio) {
            sql += ` AND ass.fecha >= ?`
            params.push(fechaInicio)
        }

        if (fechaFin) {
            sql += ` AND ass.fecha <= ?`
            params.push(fechaFin)
        }

        sql += ` ORDER BY ass.fecha DESC, ts.nombre`

        const [asistencias] = await connection.execute(sql, params)

        connection.release()

        return {
            success: true,
            datos: {
                asistencias
            }
        }
    } catch (error) {
        console.error('Error al obtener reporte de asistencias:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al generar el reporte'
        }
    }
}

export async function obtenerReporteGastos(obraId, fechaInicio, fechaFin) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        let sql = `
            SELECT 
                fecha,
                tipo_gasto,
                concepto,
                descripcion,
                monto,
                proveedor,
                numero_factura,
                metodo_pago
             FROM gastos_obra_simple
             WHERE obra_id = ?
        `

        const params = [obraId]

        if (fechaInicio) {
            sql += ` AND fecha >= ?`
            params.push(fechaInicio)
        }

        if (fechaFin) {
            sql += ` AND fecha <= ?`
            params.push(fechaFin)
        }

        sql += ` ORDER BY fecha DESC`

        const [gastos] = await connection.execute(sql, params)

        let sqlTipo = `
            SELECT 
                tipo_gasto,
                COALESCE(SUM(monto), 0) as total
             FROM gastos_obra_simple
             WHERE obra_id = ?
        `

        const paramsTipo = [obraId]

        if (fechaInicio) {
            sqlTipo += ` AND fecha >= ?`
            paramsTipo.push(fechaInicio)
        }

        if (fechaFin) {
            sqlTipo += ` AND fecha <= ?`
            paramsTipo.push(fechaFin)
        }

        sqlTipo += ` GROUP BY tipo_gasto ORDER BY total DESC`

        const [porTipo] = await connection.execute(sqlTipo, paramsTipo)

        const total = gastos.reduce((sum, g) => sum + parseFloat(g.monto), 0)

        connection.release()

        return {
            success: true,
            datos: {
                gastos,
                por_tipo: porTipo,
                total
            }
        }
    } catch (error) {
        console.error('Error al obtener reporte de gastos:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al generar el reporte'
        }
    }
}