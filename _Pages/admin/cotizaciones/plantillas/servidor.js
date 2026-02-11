"use server"

import db from "@/_DB/db"
import {cookies} from 'next/headers'

/**
 * Crea una nueva plantilla de cotización
 */
export async function crearPlantilla(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return {success: false, mensaje: 'Sesión inválida'}
        }

        connection = await db.getConnection()

        const [result] = await connection.execute(
            `INSERT INTO cotizacion_plantillas
             (empresa_id, usuario_id, nombre, descripcion,
              cliente_id, dias_validez, descuento_default,
              observaciones_default, productos_json)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                empresaId,
                userId,
                datos.nombre,
                datos.descripcion || null,
                datos.cliente_id || null,
                datos.dias_validez || 15,
                datos.descuento_default || 0,
                datos.observaciones_default || null,
                JSON.stringify(datos.productos || [])
            ]
        )

        connection.release()
        return {success: true, id: result.insertId}

    } catch (error) {
        console.error('Error al crear plantilla:', error)
        if (connection) connection.release()
        return {success: false, mensaje: 'Error al crear plantilla'}
    }
}

/**
 * Obtiene todas las plantillas de una empresa
 */
export async function obtenerPlantillas(filtros = {}) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return {success: false, mensaje: 'Sesión inválida'}

        connection = await db.getConnection()

        let query = `
            SELECT p.*,
                   u.nombre as usuario_nombre,
                   c.nombre as cliente_nombre
            FROM cotizacion_plantillas p
                     LEFT JOIN usuarios u ON p.usuario_id = u.id
                     LEFT JOIN clientes c ON p.cliente_id = c.id
            WHERE p.empresa_id = ?
        `
        const params = [empresaId]

        if (filtros.activa !== undefined) {
            query += " AND p.activa = ?"
            params.push(filtros.activa ? 1 : 0)
        }

        if (filtros.buscar) {
            query += " AND (p.nombre LIKE ? OR p.descripcion LIKE ?)"
            params.push(`%${filtros.buscar}%`, `%${filtros.buscar}%`)
        }

        query += " ORDER BY p.created_at DESC"

        const [plantillas] = await connection.execute(query, params)

        // Parsear productos_json
        const plantillasParsed = plantillas.map(p => ({
            ...p,
            productos: JSON.parse(p.productos_json || '[]')
        }))

        connection.release()
        return {success: true, plantillas: plantillasParsed}

    } catch (error) {
        console.error('Error al obtener plantillas:', error)
        if (connection) connection.release()
        return {success: false, mensaje: 'Error al cargar plantillas'}
    }
}

/**
 * Obtiene una plantilla por ID
 */
export async function obtenerPlantilla(plantillaId) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return {success: false, mensaje: 'Sesión inválida'}

        connection = await db.getConnection()

        const [plantilla] = await connection.execute(
            `SELECT p.*,
                    u.nombre as usuario_nombre,
                    c.nombre as cliente_nombre
             FROM cotizacion_plantillas p
                      LEFT JOIN usuarios u ON p.usuario_id = u.id
                      LEFT JOIN clientes c ON p.cliente_id = c.id
             WHERE p.id = ?
               AND p.empresa_id = ?`,
            [plantillaId, empresaId]
        )

        if (plantilla.length === 0) {
            connection.release()
            return {success: false, mensaje: 'Plantilla no encontrada'}
        }

        const plantillaParsed = {
            ...plantilla[0],
            productos: JSON.parse(plantilla[0].productos_json || '[]')
        }

        connection.release()
        return {success: true, plantilla: plantillaParsed}

    } catch (error) {
        console.error('Error al obtener plantilla:', error)
        if (connection) connection.release()
        return {success: false, mensaje: 'Error al cargar plantilla'}
    }
}

/**
 * Aplica una plantilla para crear una cotización
 */
export async function aplicarPlantilla(plantillaId, datosAdicionales = {}) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return {success: false, mensaje: 'Sesión inválida'}
        }

        // Obtener plantilla
        const resPlantilla = await obtenerPlantilla(plantillaId)
        if (!resPlantilla.success) {
            return resPlantilla
        }

        const plantilla = resPlantilla.plantilla

        // Calcular fecha de vencimiento
        const fechaEmision = new Date()
        const fechaVencimiento = new Date(fechaEmision)
        fechaVencimiento.setDate(fechaVencimiento.getDate() + (datosAdicionales.dias_validez || plantilla.dias_validez || 15))

        // Construir datos de cotización
        const datosCotizacion = {
            cliente_id: datosAdicionales.cliente_id || plantilla.cliente_id,
            productos: datosAdicionales.productos || plantilla.productos,
            fecha_emision: datosAdicionales.fecha_emision || fechaEmision.toISOString().split('T')[0],
            fecha_vencimiento: datosAdicionales.fecha_vencimiento || fechaVencimiento.toISOString().split('T')[0],
            descuento: datosAdicionales.descuento || plantilla.descuento_default || 0,
            observaciones: datosAdicionales.observaciones || plantilla.observaciones_default || null,
            plantilla_id: plantillaId,
            estado: datosAdicionales.estado || 'borrador'
        }

        // Importar función de crear cotización desde nuevo/servidor.js
        const {crearCotizacion} = await import('../nuevo/servidor')
        return await crearCotizacion(datosCotizacion)

    } catch (error) {
        console.error('Error al aplicar plantilla:', error)
        return {success: false, mensaje: 'Error al aplicar plantilla'}
    }
}

/**
 * Actualiza una plantilla
 */
export async function actualizarPlantilla(plantillaId, datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return {success: false, mensaje: 'Sesión inválida'}

        connection = await db.getConnection()

        const campos = []
        const valores = []

        if (datos.nombre !== undefined) {
            campos.push('nombre = ?')
            valores.push(datos.nombre)
        }
        if (datos.descripcion !== undefined) {
            campos.push('descripcion = ?')
            valores.push(datos.descripcion)
        }
        if (datos.cliente_id !== undefined) {
            campos.push('cliente_id = ?')
            valores.push(datos.cliente_id)
        }
        if (datos.dias_validez !== undefined) {
            campos.push('dias_validez = ?')
            valores.push(datos.dias_validez)
        }
        if (datos.descuento_default !== undefined) {
            campos.push('descuento_default = ?')
            valores.push(datos.descuento_default)
        }
        if (datos.observaciones_default !== undefined) {
            campos.push('observaciones_default = ?')
            valores.push(datos.observaciones_default)
        }
        if (datos.productos !== undefined) {
            campos.push('productos_json = ?')
            valores.push(JSON.stringify(datos.productos))
        }
        if (datos.activa !== undefined) {
            campos.push('activa = ?')
            valores.push(datos.activa ? 1 : 0)
        }

        if (campos.length === 0) {
            connection.release()
            return {success: false, mensaje: 'No hay campos para actualizar'}
        }

        valores.push(plantillaId, empresaId)

        await connection.execute(
            `UPDATE cotizacion_plantillas
             SET ${campos.join(', ')}
             WHERE id = ?
               AND empresa_id = ?`,
            valores
        )

        connection.release()
        return {success: true, mensaje: 'Plantilla actualizada'}

    } catch (error) {
        console.error('Error al actualizar plantilla:', error)
        if (connection) connection.release()
        return {success: false, mensaje: 'Error al actualizar plantilla'}
    }
}

/**
 * Elimina una plantilla (soft delete)
 */
export async function eliminarPlantilla(plantillaId) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return {success: false, mensaje: 'Sesión inválida'}

        connection = await db.getConnection()

        await connection.execute(
            `UPDATE cotizacion_plantillas
             SET activa = 0
             WHERE id = ?
               AND empresa_id = ?`,
            [plantillaId, empresaId]
        )

        connection.release()
        return {success: true, mensaje: 'Plantilla eliminada'}

    } catch (error) {
        console.error('Error al eliminar plantilla:', error)
        if (connection) connection.release()
        return {success: false, mensaje: 'Error al eliminar plantilla'}
    }
}

