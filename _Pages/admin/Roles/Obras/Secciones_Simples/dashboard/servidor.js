'use server'
import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerDashboardSimple(filtros = {}) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        const { obra_id } = filtros
        connection = await db.getConnection()

        const [empresa] = await connection.query(
            'SELECT simbolo_moneda, moneda FROM empresas WHERE id = ?',
            [empresaId]
        )

        const simboloMoneda = empresa[0]?.simbolo_moneda || 'RD$'
        const codigoMoneda = empresa[0]?.moneda || 'DOP'
        const filtroObraSql = obra_id ? 'AND os.id = ?' : ''
        const filtroObraParams = obra_id ? [empresaId, obra_id] : [empresaId]

        const queryObras = `
            SELECT 
                os.*,
                (SELECT COUNT(*) FROM asignaciones_obra_simple aos 
                 WHERE aos.obra_id = os.id AND aos.activo = TRUE) as total_trabajadores
            FROM obras_simples os
            WHERE os.empresa_id = ?
            AND os.estado = 'activa'
            ${filtroObraSql}
            ORDER BY os.fecha_creacion DESC
        `
        
        const [obrasActivas] = await connection.query(queryObras, filtroObraParams)

        const [resumenObrasRows] = await connection.query(
            `SELECT COUNT(*) as total_obras_activas
             FROM obras_simples os
             WHERE os.empresa_id = ?
             AND os.estado = 'activa'
             ${filtroObraSql}`,
            filtroObraParams
        )

        const [resumenTrabajadoresRows] = await connection.query(
            `SELECT COUNT(DISTINCT aos.trabajador_id) as total_trabajadores
             FROM obras_simples os
             INNER JOIN asignaciones_obra_simple aos ON aos.obra_id = os.id AND aos.activo = TRUE
             INNER JOIN trabajadores_simples ts ON ts.id = aos.trabajador_id AND ts.activo = TRUE
             WHERE os.empresa_id = ?
             AND os.estado = 'activa'
             ${filtroObraSql}`,
            filtroObraParams
        )

        const [resumenAsistenciasHoyRows] = await connection.query(
            `SELECT COUNT(*) as asistencias_hoy
             FROM asistencias_simple ass
             INNER JOIN obras_simples os ON os.id = ass.obra_id
             WHERE os.empresa_id = ?
             AND os.estado = 'activa'
             AND ass.fecha = CURDATE()
             AND ass.presente = TRUE
             ${obra_id ? 'AND ass.obra_id = ?' : ''}`,
            obra_id ? [empresaId, obra_id] : [empresaId]
        )

        const [resumenGastosMesRows] = await connection.query(
            `SELECT COALESCE(SUM(gos.monto), 0) as gastos_mes
             FROM gastos_obra_simple gos
             INNER JOIN obras_simples os ON os.id = gos.obra_id
             WHERE os.empresa_id = ?
             AND os.estado = 'activa'
             AND MONTH(gos.fecha) = MONTH(CURDATE())
             AND YEAR(gos.fecha) = YEAR(CURDATE())
             ${obra_id ? 'AND gos.obra_id = ?' : ''}`,
            obra_id ? [empresaId, obra_id] : [empresaId]
        )

        const [resumenAsistenciasRows] = await connection.query(
            `SELECT 
                COUNT(DISTINCT ass.fecha) as dias_trabajados,
                COALESCE(SUM(ass.horas_trabajadas), 0) as horas_trabajadas,
                COALESCE(SUM(CASE WHEN ass.pagado = FALSE THEN ass.monto_pagar ELSE 0 END), 0) as pagos_pendientes
             FROM asistencias_simple ass
             INNER JOIN obras_simples os ON os.id = ass.obra_id
             WHERE os.empresa_id = ?
             AND os.estado = 'activa'
             AND ass.presente = TRUE
             ${obra_id ? 'AND ass.obra_id = ?' : ''}`,
            obra_id ? [empresaId, obra_id] : [empresaId]
        )

        const [resumenGastosRows] = await connection.query(
            `SELECT COALESCE(SUM(gos.monto), 0) as gastos_acumulados
             FROM gastos_obra_simple gos
             INNER JOIN obras_simples os ON os.id = gos.obra_id
             WHERE os.empresa_id = ?
             AND os.estado = 'activa'
             ${obra_id ? 'AND gos.obra_id = ?' : ''}`,
            obra_id ? [empresaId, obra_id] : [empresaId]
        )

        const resumen = resumenObrasRows[0] || {}
        const resumenTrabajadores = resumenTrabajadoresRows[0] || {}
        const resumenAsistenciasHoy = resumenAsistenciasHoyRows[0] || {}
        const resumenGastosMes = resumenGastosMesRows[0] || {}
        const resumenAsistencias = resumenAsistenciasRows[0] || {}
        const resumenGastos = resumenGastosRows[0] || {}

        const queryGastosRecientes = `
            SELECT 
                gos.*,
                os.nombre as obra_nombre,
                os.codigo_obra
            FROM gastos_obra_simple gos
            INNER JOIN obras_simples os ON os.id = gos.obra_id
            WHERE os.empresa_id = ?
            ${obra_id ? 'AND gos.obra_id = ?' : ''}
            ORDER BY gos.fecha DESC, gos.fecha_creacion DESC
            LIMIT 20
        `
        
        const gastosParams = obra_id ? [empresaId, obra_id] : [empresaId]
        const [gastosRecientes] = await connection.query(queryGastosRecientes, gastosParams)

        connection.release()

        return {
            success: true,
            datos: {
                obras_activas: obrasActivas,
                simbolo_moneda: simboloMoneda,
                codigo_moneda: codigoMoneda,
                resumen: {
                    total_obras_activas: parseInt(resumen.total_obras_activas) || 0,
                    total_trabajadores: parseInt(resumenTrabajadores.total_trabajadores) || 0,
                    asistencias_hoy: parseInt(resumenAsistenciasHoy.asistencias_hoy) || 0,
                    gastos_mes: parseFloat(resumenGastosMes.gastos_mes) || 0,
                    dias_trabajados: parseInt(resumenAsistencias.dias_trabajados) || 0,
                    horas_trabajadas: parseFloat(resumenAsistencias.horas_trabajadas) || 0,
                    gastos_acumulados: parseFloat(resumenGastos.gastos_acumulados) || 0,
                    pagos_pendientes: parseFloat(resumenAsistencias.pagos_pendientes) || 0
                },
                gastos_recientes: gastosRecientes
            }
        }
    } catch (error) {
        console.error('Error al obtener dashboard simple:', error)
        if (connection) connection.release()
        return {
            success: false,
            mensaje: 'Error al cargar el dashboard'
        }
    }
}

export async function obtenerObrasSimples(filtros = {}) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        const { estado, busqueda } = filtros
        connection = await db.getConnection()

        let sql = `
            SELECT 
                os.*,
                (SELECT COUNT(*) FROM asignaciones_obra_simple aos 
                 WHERE aos.obra_id = os.id AND aos.activo = TRUE) as total_trabajadores,
                (SELECT COALESCE(SUM(gos.monto), 0) FROM gastos_obra_simple gos 
                 WHERE gos.obra_id = os.id) as total_gastos
            FROM obras_simples os
            WHERE os.empresa_id = ?
        `

        const params = [empresaId]

        if (estado) {
            sql += ` AND os.estado = ?`
            params.push(estado)
        }

        if (busqueda) {
            sql += ` AND (os.nombre LIKE ? OR os.codigo_obra LIKE ? OR os.cliente_nombre LIKE ?)`
            const busquedaParam = `%${busqueda}%`
            params.push(busquedaParam, busquedaParam, busquedaParam)
        }

        sql += ` ORDER BY os.fecha_creacion DESC`

        const [obras] = await connection.query(sql, params)
        connection.release()

        return {
            success: true,
            obras
        }
    } catch (error) {
        console.error('Error al obtener obras simples:', error)
        if (connection) connection.release()
        return {
            success: false,
            mensaje: 'Error al cargar las obras'
        }
    }
}

export async function crearObraSimple(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()

        const sql = `
            INSERT INTO obras_simples (
                empresa_id,
                codigo_obra,
                nombre,
                descripcion,
                direccion,
                cliente_nombre,
                cliente_telefono,
                cliente_email,
                presupuesto_total,
                fecha_inicio,
                fecha_fin_estimada,
                color_identificacion,
                notas,
                usuario_creador
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `

        const [resultado] = await connection.query(sql, [
            empresaId,
            datos.codigo_obra,
            datos.nombre,
            datos.descripcion || null,
            datos.direccion || null,
            datos.cliente_nombre || null,
            datos.cliente_telefono || null,
            datos.cliente_email || null,
            datos.presupuesto_total || 0,
            datos.fecha_inicio || null,
            datos.fecha_fin_estimada || null,
            datos.color_identificacion || '#3b82f6',
            datos.notas || null,
            userId
        ])

        connection.release()

        return {
            success: true,
            mensaje: 'Obra creada exitosamente',
            id: resultado.insertId
        }
    } catch (error) {
        console.error('Error al crear obra simple:', error)
        if (connection) connection.release()
        
        if (error.code === 'ER_DUP_ENTRY') {
            return {
                success: false,
                mensaje: 'Ya existe una obra con ese código'
            }
        }

        return {
            success: false,
            mensaje: 'Error al crear la obra'
        }
    }
}

export async function actualizarObraSimple(id, datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()

        const sql = `
            UPDATE obras_simples SET
                nombre = ?,
                descripcion = ?,
                direccion = ?,
                cliente_nombre = ?,
                cliente_telefono = ?,
                cliente_email = ?,
                presupuesto_total = ?,
                fecha_inicio = ?,
                fecha_fin_estimada = ?,
                estado = ?,
                color_identificacion = ?,
                notas = ?
            WHERE id = ? AND empresa_id = ?
        `

        await connection.query(sql, [
            datos.nombre,
            datos.descripcion || null,
            datos.direccion || null,
            datos.cliente_nombre || null,
            datos.cliente_telefono || null,
            datos.cliente_email || null,
            datos.presupuesto_total || 0,
            datos.fecha_inicio || null,
            datos.fecha_fin_estimada || null,
            datos.estado,
            datos.color_identificacion || '#3b82f6',
            datos.notas || null,
            id,
            empresaId
        ])

        connection.release()

        return {
            success: true,
            mensaje: 'Obra actualizada exitosamente'
        }
    } catch (error) {
        console.error('Error al actualizar obra simple:', error)
        if (connection) connection.release()
        return {
            success: false,
            mensaje: 'Error al actualizar la obra'
        }
    }
}

export async function eliminarObraSimple(id) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()

        await connection.query(
            'DELETE FROM obras_simples WHERE id = ? AND empresa_id = ?',
            [id, empresaId]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Obra eliminada exitosamente'
        }
    } catch (error) {
        console.error('Error al eliminar obra simple:', error)
        if (connection) connection.release()
        return {
            success: false,
            mensaje: 'Error al eliminar la obra'
        }
    }
}