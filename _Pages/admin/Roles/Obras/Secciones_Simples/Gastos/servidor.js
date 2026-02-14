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

        const [gastos] = await connection.execute(
            `SELECT 
                id,
                fecha,
                tipo_gasto,
                concepto,
                descripcion,
                monto,
                proveedor,
                numero_factura,
                metodo_pago,
                notas
             FROM gastos_obra_simple
             WHERE obra_id = ?
             ORDER BY fecha DESC, id DESC`,
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
                registrado_por
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            userId
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

export async function eliminarGasto(id) {
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
            'DELETE FROM gastos_obra_simple WHERE id = ?',
            [id]
        )

        connection.release()

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