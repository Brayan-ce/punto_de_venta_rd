"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerMonedaEmpresa() {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()

        const [empresa] = await connection.query(
            'SELECT simbolo_moneda, moneda FROM empresas WHERE id = ?',
            [empresaId]
        )

        connection.release()

        const simboloMoneda = empresa[0]?.simbolo_moneda || 'RD$'
        const codigoMoneda = empresa[0]?.moneda || 'DOP'

        return {
            success: true,
            simbolo_moneda: simboloMoneda,
            codigo_moneda: codigoMoneda
        }
    } catch (error) {
        console.error('Error al obtener moneda:', error)
        if (connection) connection.release()
        return {
            success: false,
            mensaje: 'Error al obtener moneda'
        }
    }
}

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
            `SELECT id, codigo_obra, nombre, color_identificacion, presupuesto_total
             FROM obras_simples
             WHERE empresa_id = ? AND estado = 'activa'
             ORDER BY nombre`,
            [empresaId]
        )

        connection.release()

        return {
            success: true,
            obras
        }
    } catch (error) {
        console.error('Error al obtener obras activas:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar las obras'
        }
    }
}

export async function obtenerGastosObra(obraId) {
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
            'SELECT id FROM obras_simples WHERE id = ? AND empresa_id = ?',
            [obraId, empresaId]
        )
        if (obras.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Obra no encontrada' }
        }

        const [gastos] = await connection.execute(
            `SELECT 
                g.id,
                g.fecha,
                g.tipo_gasto,
                g.concepto,
                g.descripcion,
                g.monto,
                g.proveedor,
                g.numero_factura,
                g.metodo_pago,
                g.notas,
                g.registrado_por,
                g.quien_compro_id,
                COALESCE(u2.nombre, u.nombre) as quien_compro_nombre,
                u.nombre as registrado_por_nombre
             FROM gastos_obra_simple g
             LEFT JOIN usuarios u ON g.registrado_por = u.id
             LEFT JOIN usuarios u2 ON g.quien_compro_id = u2.id
             WHERE g.obra_id = ?
             ORDER BY g.fecha DESC, g.id DESC`,
            [obraId]
        )

        connection.release()

        return {
            success: true,
            gastos
        }
    } catch (error) {
        console.error('Error al obtener gastos:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar los gastos'
        }
    }
}

export async function obtenerUsuariosEmpresa() {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesion invalida' }
        }

        connection = await db.getConnection()

        const [usuarios] = await connection.execute(
            'SELECT id, nombre FROM usuarios WHERE empresa_id = ? AND activo = TRUE ORDER BY nombre',
            [empresaId]
        )

        connection.release()

        return { success: true, usuarios }
    } catch (error) {
        console.error('Error al obtener usuarios:', error)
        if (connection) connection.release()
        return { success: false, usuarios: [] }
    }
}

export async function obtenerGastoPorId(gastoId, obraId) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return { success: false, mensaje: 'Sesion invalida' }
        }

        connection = await db.getConnection()

        const [obras] = await connection.execute(
            'SELECT id FROM obras_simples WHERE id = ? AND empresa_id = ?',
            [obraId, empresaId]
        )
        if (obras.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Obra no encontrada' }
        }

        const [rows] = await connection.execute(
            `SELECT 
                g.id,
                g.obra_id,
                g.fecha,
                g.tipo_gasto,
                g.concepto,
                g.descripcion,
                g.monto,
                g.proveedor,
                g.numero_factura,
                g.metodo_pago,
                g.notas,
                g.registrado_por,
                g.quien_compro_id,
                COALESCE(u2.nombre, u.nombre) as quien_compro_nombre,
                u.nombre as registrado_por_nombre
             FROM gastos_obra_simple g
             LEFT JOIN usuarios u ON g.registrado_por = u.id
             LEFT JOIN usuarios u2 ON g.quien_compro_id = u2.id
             WHERE g.id = ? AND g.obra_id = ?`,
            [gastoId, obraId]
        )

        connection.release()

        if (rows.length === 0) {
            return { success: false, mensaje: 'Gasto no encontrado' }
        }

        return { success: true, gasto: rows[0] }
    } catch (error) {
        console.error('Error al obtener gasto:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar el gasto' }
    }
}

export async function crearGasto(obraId, datos) {
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
            'SELECT id FROM obras_simples WHERE id = ? AND empresa_id = ?',
            [obraId, empresaId]
        )
        if (obras.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Obra no encontrada' }
        }

        const quienComproId = datos.quien_compro_id ? parseInt(datos.quien_compro_id, 10) : null

        const sql = `
            INSERT INTO gastos_obra_simple (
                obra_id,
                fecha,
                tipo_gasto,
                concepto,
                descripcion,
                monto,
                proveedor,
                numero_factura,
                metodo_pago,
                notas,
                registrado_por,
                quien_compro_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `

        await connection.execute(sql, [
            obraId,
            datos.fecha,
            datos.tipo_gasto,
            datos.concepto,
            datos.descripcion || null,
            datos.monto,
            datos.proveedor || null,
            datos.numero_factura || null,
            datos.metodo_pago,
            datos.notas || null,
            userId,
            quienComproId
        ])

        connection.release()

        return {
            success: true,
            mensaje: 'Gasto creado exitosamente'
        }
    } catch (error) {
        console.error('Error al crear gasto:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al crear el gasto'
        }
    }
}

export async function actualizarGasto(gastoId, obraId, datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return { success: false, mensaje: 'Sesion invalida' }
        }

        connection = await db.getConnection()

        const [obras] = await connection.execute(
            'SELECT id FROM obras_simples WHERE id = ? AND empresa_id = ?',
            [obraId, empresaId]
        )
        if (obras.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Obra no encontrada' }
        }

        const [existe] = await connection.execute(
            'SELECT id FROM gastos_obra_simple WHERE id = ? AND obra_id = ?',
            [gastoId, obraId]
        )
        if (existe.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Gasto no encontrado' }
        }

        const quienComproId = datos.quien_compro_id ? parseInt(datos.quien_compro_id, 10) : null

        await connection.execute(
            `UPDATE gastos_obra_simple SET
                fecha = ?,
                tipo_gasto = ?,
                concepto = ?,
                descripcion = ?,
                monto = ?,
                proveedor = ?,
                numero_factura = ?,
                metodo_pago = ?,
                notas = ?,
                quien_compro_id = ?
             WHERE id = ? AND obra_id = ?`,
            [
                datos.fecha,
                datos.tipo_gasto,
                datos.concepto,
                datos.descripcion || null,
                datos.monto,
                datos.proveedor || null,
                datos.numero_factura || null,
                datos.metodo_pago,
                datos.notas || null,
                quienComproId,
                gastoId,
                obraId
            ]
        )

        connection.release()

        return { success: true, mensaje: 'Gasto actualizado' }
    } catch (error) {
        console.error('Error al actualizar gasto:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al actualizar' }
    }
}

export async function eliminarGasto(id, obraId) {
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
            'SELECT id FROM obras_simples WHERE id = ? AND empresa_id = ?',
            [obraId, empresaId]
        )
        if (obras.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Obra no encontrada' }
        }

        const [result] = await connection.execute(
            'DELETE FROM gastos_obra_simple WHERE id = ? AND obra_id = ?',
            [id, obraId]
        )

        connection.release()

        if (result.affectedRows === 0) {
            return { success: false, mensaje: 'Gasto no encontrado' }
        }

        return {
            success: true,
            mensaje: 'Gasto eliminado exitosamente'
        }
    } catch (error) {
        console.error('Error al eliminar gasto:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al eliminar el gasto'
        }
    }
}