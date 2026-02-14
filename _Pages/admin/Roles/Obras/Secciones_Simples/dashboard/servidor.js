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

        const queryObras = `
            SELECT 
                os.*,
                (SELECT COUNT(*) FROM asignaciones_obra_simple aos 
                 WHERE aos.obra_id = os.id AND aos.activo = TRUE) as total_trabajadores
            FROM obras_simples os
            WHERE os.empresa_id = ?
            AND os.estado = 'activa'
            ${obra_id ? 'AND os.id = ?' : ''}
            ORDER BY os.fecha_creacion DESC
        `
        
        const obrasParams = obra_id ? [empresaId, obra_id] : [empresaId]
        const [obrasActivas] = await connection.query(queryObras, obrasParams)

        const queryResumen = `
            SELECT 
                COUNT(DISTINCT os.id) as total_obras_activas,
                COUNT(DISTINCT ts.id) as total_trabajadores,
                COUNT(DISTINCT ass.id) as asistencias_hoy,
                COALESCE(SUM(gos.monto), 0) as gastos_mes
            FROM obras_simples os
            LEFT JOIN trabajadores_simples ts ON ts.empresa_id = os.empresa_id AND ts.activo = TRUE
            LEFT JOIN asistencias_simple ass ON ass.obra_id = os.id 
                AND DATE(ass.fecha) = CURDATE()
            LEFT JOIN gastos_obra_simple gos ON gos.obra_id = os.id 
                AND MONTH(gos.fecha) = MONTH(CURDATE())
                AND YEAR(gos.fecha) = YEAR(CURDATE())
            WHERE os.empresa_id = ?
            AND os.estado = 'activa'
            ${obra_id ? 'AND os.id = ?' : ''}
        `
        
        const resumenParams = obra_id ? [empresaId, obra_id] : [empresaId]
        const [resumenRows] = await connection.query(queryResumen, resumenParams)
        const resumen = resumenRows[0]

        const queryResumenSemanal = `
            SELECT 
                COUNT(DISTINCT DATE(ass.fecha)) as dias_trabajados_semana,
                COALESCE(SUM(ass.horas_trabajadas), 0) as horas_semana,
                COALESCE(SUM(gos.monto), 0) as gastos_semana,
                COALESCE(SUM(CASE WHEN ass.pagado = FALSE THEN ass.monto_pagar ELSE 0 END), 0) as pagos_pendientes
            FROM obras_simples os
            LEFT JOIN asistencias_simple ass ON ass.obra_id = os.id 
                AND ass.fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            LEFT JOIN gastos_obra_simple gos ON gos.obra_id = os.id 
                AND gos.fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            WHERE os.empresa_id = ?
            AND os.estado = 'activa'
            ${obra_id ? 'AND os.id = ?' : ''}
        `
        
        const resumenSemanalParams = obra_id ? [empresaId, obra_id] : [empresaId]
        const [resumenSemanalRows] = await connection.query(queryResumenSemanal, resumenSemanalParams)
        const resumenSemanal = resumenSemanalRows[0]

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
                    total_trabajadores: parseInt(resumen.total_trabajadores) || 0,
                    asistencias_hoy: parseInt(resumen.asistencias_hoy) || 0,
                    gastos_mes: parseFloat(resumen.gastos_mes) || 0,
                    dias_trabajados_semana: parseInt(resumenSemanal.dias_trabajados_semana) || 0,
                    horas_semana: parseFloat(resumenSemanal.horas_semana) || 0,
                    gastos_semana: parseFloat(resumenSemanal.gastos_semana) || 0,
                    pagos_pendientes: parseFloat(resumenSemanal.pagos_pendientes) || 0
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