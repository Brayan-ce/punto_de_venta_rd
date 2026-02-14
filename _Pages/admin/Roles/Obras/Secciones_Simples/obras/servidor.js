"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerObrasSimples(filtros = {}) {
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

        const [obras] = await connection.execute(sql, params)

        connection.release()

        return {
            success: true,
            obras
        }
    } catch (error) {
        console.error('Error al obtener obras simples:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar las obras'
        }
    }
}

export async function obtenerObraSimple(id) {
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
                os.*,
                (SELECT COUNT(*) FROM asignaciones_obra_simple aos 
                 WHERE aos.obra_id = os.id AND aos.activo = TRUE) as total_trabajadores,
                (SELECT COALESCE(SUM(gos.monto), 0) FROM gastos_obra_simple gos 
                 WHERE gos.obra_id = os.id) as total_gastos,
                (SELECT COUNT(*) FROM asistencias_simple ass 
                 WHERE ass.obra_id = os.id) as total_asistencias,
                (SELECT COUNT(*) FROM fotos_obra_simple fos 
                 WHERE fos.obra_id = os.id) as total_fotos
            FROM obras_simples os
            WHERE os.id = ? AND os.empresa_id = ?
        `

        const [obra] = await connection.execute(sql, [id, empresaId])

        connection.release()

        if (obra.length === 0) {
            return {
                success: false,
                mensaje: 'Obra no encontrada'
            }
        }

        return {
            success: true,
            obra: obra[0]
        }
    } catch (error) {
        console.error('Error al obtener obra simple:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar la obra'
        }
    }
}

export async function verificarCodigoObra(codigo) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { disponible: false }
        }

        connection = await db.getConnection()

        const [resultado] = await connection.execute(
            'SELECT COUNT(*) as cuenta FROM obras_simples WHERE empresa_id = ? AND codigo_obra = ?',
            [empresaId, codigo]
        )

        connection.release()

        return {
            disponible: resultado[0].cuenta === 0
        }
    } catch (error) {
        console.error('Error al verificar codigo:', error)
        if (connection) connection.release()
        return { disponible: false }
    }
}

export async function crearObraSimple(datos) {
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

        const [resultado] = await connection.execute(sql, [
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
            datos.color_identificacion || '#0284c7',
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

        if (connection) {
            connection.release()
        }
        
        if (error.code === 'ER_DUP_ENTRY') {
            return {
                success: false,
                mensaje: 'Ya existe una obra con ese codigo'
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

        await connection.execute(sql, [
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
            datos.color_identificacion || '#0284c7',
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

        if (connection) {
            connection.release()
        }

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

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al eliminar la obra'
        }
    }
}

export async function cambiarEstadoObra(id, nuevoEstado) {
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

        const estadosValidos = ['activa', 'pausada', 'finalizada', 'cancelada']
        if (!estadosValidos.includes(nuevoEstado)) {
            return {
                success: false,
                mensaje: 'Estado no valido'
            }
        }

        connection = await db.getConnection()

        await connection.execute(
            'UPDATE obras_simples SET estado = ? WHERE id = ? AND empresa_id = ?',
            [nuevoEstado, id, empresaId]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Estado actualizado exitosamente'
        }
    } catch (error) {
        console.error('Error al cambiar estado de obra:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cambiar el estado'
        }
    }
}

export async function obtenerTrabajadoresDisponibles() {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesion invalida' }
        }

        connection = await db.getConnection()

        const [trabajadores] = await connection.execute(
            `SELECT id, codigo_trabajador, nombre, apellido, especialidad, salario_diario
             FROM trabajadores_simples
             WHERE empresa_id = ? AND activo = TRUE
             ORDER BY nombre, apellido`,
            [empresaId]
        )

        connection.release()

        return {
            success: true,
            trabajadores
        }
    } catch (error) {
        console.error('Error al obtener trabajadores:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar trabajadores' }
    }
}

export async function asignarTrabajadoresObra(obraId, trabajadorIds) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesion invalida' }
        }

        connection = await db.getConnection()

        for (const trabajadorId of trabajadorIds) {
            await connection.execute(
                `INSERT INTO asignaciones_obra_simple (obra_id, trabajador_id, fecha_asignacion, activo)
                 VALUES (?, ?, CURDATE(), TRUE)
                 ON DUPLICATE KEY UPDATE activo = TRUE`,
                [obraId, trabajadorId]
            )
        }

        connection.release()

        return { success: true }
    } catch (error) {
        console.error('Error al asignar trabajadores:', error)
        if (connection) connection.release()
        return { success: false }
    }
}

export async function crearTrabajadorRapido(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesion invalida' }
        }

        connection = await db.getConnection()

        const codigoTrabajador = `T-${Date.now().toString().slice(-6)}`

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
                activo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)
        `

        const [resultado] = await connection.execute(sql, [
            empresaId,
            codigoTrabajador,
            datos.nombre,
            datos.apellido || null,
            datos.cedula || null,
            datos.telefono || null,
            datos.especialidad || null,
            datos.salario_diario || 0
        ])

        connection.release()

        return {
            success: true,
            id: resultado.insertId
        }
    } catch (error) {
        console.error('Error al crear trabajador rapido:', error)
        if (connection) connection.release()
        
        if (error.code === 'ER_DUP_ENTRY') {
            return {
                success: false,
                mensaje: 'Ya existe un trabajador con esa cedula'
            }
        }

        return { success: false, mensaje: 'Error al crear trabajador' }
    }
}

export async function obtenerTrabajadoresAsignados(obraId) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesion invalida' }
        }

        connection = await db.getConnection()

        const [asignados] = await connection.execute(
            `SELECT trabajador_id
             FROM asignaciones_obra_simple
             WHERE obra_id = ? AND activo = TRUE`,
            [obraId]
        )

        connection.release()

        return {
            success: true,
            trabajadorIds: asignados.map(a => a.trabajador_id)
        }
    } catch (error) {
        console.error('Error al obtener trabajadores asignados:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar asignaciones' }
    }
}

export async function actualizarAsignacionesTrabajadores(obraId, nuevosIds) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesion invalida' }
        }

        connection = await db.getConnection()

        await connection.execute(
            'UPDATE asignaciones_obra_simple SET activo = FALSE WHERE obra_id = ?',
            [obraId]
        )

        for (const trabajadorId of nuevosIds) {
            await connection.execute(
                `INSERT INTO asignaciones_obra_simple (obra_id, trabajador_id, fecha_asignacion, activo)
                 VALUES (?, ?, CURDATE(), TRUE)
                 ON DUPLICATE KEY UPDATE activo = TRUE, fecha_asignacion = CURDATE()`,
                [obraId, trabajadorId]
            )
        }

        connection.release()

        return { success: true }
    } catch (error) {
        console.error('Error al actualizar asignaciones:', error)
        if (connection) connection.release()
        return { success: false }
    }
}