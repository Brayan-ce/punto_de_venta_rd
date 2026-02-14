"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerTrabajadoresSimples(filtros = {}) {
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

        const { busqueda, especialidad, activo } = filtros

        connection = await db.getConnection()

        let sql = `
            SELECT 
                ts.*,
                (SELECT COUNT(*) FROM asignaciones_obra_simple aos 
                 WHERE aos.trabajador_id = ts.id AND aos.activo = TRUE) as obras_activas
            FROM trabajadores_simples ts
            WHERE ts.empresa_id = ?
        `

        const params = [empresaId]

        if (activo !== '' && activo !== undefined) {
            sql += ` AND ts.activo = ?`
            params.push(activo === 'true')
        }

        if (especialidad) {
            sql += ` AND ts.especialidad = ?`
            params.push(especialidad)
        }

        if (busqueda) {
            sql += ` AND (ts.nombre LIKE ? OR ts.apellido LIKE ? OR ts.cedula LIKE ? OR ts.codigo_trabajador LIKE ?)`
            const busquedaParam = `%${busqueda}%`
            params.push(busquedaParam, busquedaParam, busquedaParam, busquedaParam)
        }

        sql += ` ORDER BY ts.nombre, ts.apellido`

        const [trabajadores] = await connection.execute(sql, params)

        connection.release()

        return {
            success: true,
            trabajadores
        }
    } catch (error) {
        console.error('Error al obtener trabajadores:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar los trabajadores'
        }
    }
}

export async function obtenerTrabajadorSimple(id) {
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

        const sql = `
            SELECT 
                ts.*,
                (SELECT COUNT(*) FROM asignaciones_obra_simple aos 
                 WHERE aos.trabajador_id = ts.id AND aos.activo = TRUE) as obras_activas,
                (SELECT COUNT(*) FROM asistencias_simple ass 
                 WHERE ass.trabajador_id = ts.id) as total_asistencias,
                (SELECT COALESCE(SUM(pts.monto_neto), 0) FROM pagos_trabajadores_simple pts 
                 WHERE pts.trabajador_id = ts.id) as total_pagado
            FROM trabajadores_simples ts
            WHERE ts.id = ? AND ts.empresa_id = ?
        `

        const [trabajador] = await connection.execute(sql, [id, empresaId])

        connection.release()

        if (trabajador.length === 0) {
            return {
                success: false,
                mensaje: 'Trabajador no encontrado'
            }
        }

        return {
            success: true,
            trabajador: trabajador[0]
        }
    } catch (error) {
        console.error('Error al obtener trabajador:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar el trabajador'
        }
    }
}

export async function crearTrabajadorSimple(datos) {
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

        const codigoTrabajador = datos.codigo_trabajador || `T-${Date.now().toString().slice(-6)}`

        const sql = `
            INSERT INTO trabajadores_simples (
                empresa_id,
                codigo_trabajador,
                nombre,
                apellido,
                cedula,
                telefono,
                especialidad,
                salario_diario,
                tipo_pago,
                direccion,
                contacto_emergencia,
                telefono_emergencia,
                fecha_ingreso,
                notas,
                activo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
        `

        const [resultado] = await connection.execute(sql, [
            empresaId,
            codigoTrabajador,
            datos.nombre,
            datos.apellido || null,
            datos.cedula || null,
            datos.telefono || null,
            datos.especialidad || null,
            datos.salario_diario || 0,
            datos.tipo_pago || 'diario',
            datos.direccion || null,
            datos.contacto_emergencia || null,
            datos.telefono_emergencia || null,
            datos.fecha_ingreso || null,
            datos.notas || null
        ])

        connection.release()

        return {
            success: true,
            mensaje: 'Trabajador creado exitosamente',
            id: resultado.insertId
        }
    } catch (error) {
        console.error('Error al crear trabajador:', error)

        if (connection) {
            connection.release()
        }
        
        if (error.code === 'ER_DUP_ENTRY') {
            return {
                success: false,
                mensaje: 'Ya existe un trabajador con esa cedula'
            }
        }

        return {
            success: false,
            mensaje: 'Error al crear el trabajador'
        }
    }
}

export async function actualizarTrabajadorSimple(id, datos) {
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

        const sql = `
            UPDATE trabajadores_simples SET
                nombre = ?,
                apellido = ?,
                cedula = ?,
                telefono = ?,
                especialidad = ?,
                salario_diario = ?,
                tipo_pago = ?,
                direccion = ?,
                contacto_emergencia = ?,
                telefono_emergencia = ?,
                fecha_ingreso = ?,
                notas = ?,
                activo = ?
            WHERE id = ? AND empresa_id = ?
        `

        await connection.execute(sql, [
            datos.nombre,
            datos.apellido || null,
            datos.cedula || null,
            datos.telefono || null,
            datos.especialidad || null,
            datos.salario_diario || 0,
            datos.tipo_pago || 'diario',
            datos.direccion || null,
            datos.contacto_emergencia || null,
            datos.telefono_emergencia || null,
            datos.fecha_ingreso || null,
            datos.notas || null,
            datos.activo !== undefined ? datos.activo : true,
            id,
            empresaId
        ])

        connection.release()

        return {
            success: true,
            mensaje: 'Trabajador actualizado exitosamente'
        }
    } catch (error) {
        console.error('Error al actualizar trabajador:', error)

        if (connection) {
            connection.release()
        }

        if (error.code === 'ER_DUP_ENTRY') {
            return {
                success: false,
                mensaje: 'Ya existe un trabajador con esa cedula'
            }
        }

        return {
            success: false,
            mensaje: 'Error al actualizar el trabajador'
        }
    }
}

export async function eliminarTrabajadorSimple(id) {
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

        await connection.execute(
            'DELETE FROM trabajadores_simples WHERE id = ? AND empresa_id = ?',
            [id, empresaId]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Trabajador eliminado exitosamente'
        }
    } catch (error) {
        console.error('Error al eliminar trabajador:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al eliminar el trabajador'
        }
    }
}

export async function cambiarEstadoTrabajador(id, activo) {
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

        await connection.execute(
            'UPDATE trabajadores_simples SET activo = ? WHERE id = ? AND empresa_id = ?',
            [activo, id, empresaId]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Estado actualizado exitosamente'
        }
    } catch (error) {
        console.error('Error al cambiar estado:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cambiar el estado'
        }
    }
}