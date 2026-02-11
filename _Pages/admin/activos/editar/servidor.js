"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

/**
 * Obtiene un activo por su ID
 * @param {number} id - ID del activo
 * @returns {Object} { success: boolean, activo?: Object, mensaje?: string }
 */
export async function obtenerActivoPorId(id) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        const [activos] = await connection.execute(
            `SELECT a.*,
                   p.nombre as producto_nombre,
                   p.sku as producto_sku,
                   p.tipo_activo,
                   cl.nombre as cliente_nombre,
                   cl.apellidos as cliente_apellidos,
                   cl.numero_documento as cliente_documento,
                   cl.telefono as cliente_telefono,
                   cl.email as cliente_email,
                   c.numero_contrato,
                   c.saldo_pendiente as contrato_saldo_pendiente,
                   u.nombre as creado_por_nombre,
                   u2.nombre as modificado_por_nombre
            FROM activos_productos a
            LEFT JOIN productos p ON a.producto_id = p.id
            LEFT JOIN clientes cl ON a.cliente_id = cl.id
            LEFT JOIN contratos_financiamiento c ON a.contrato_financiamiento_id = c.id
            LEFT JOIN usuarios u ON a.creado_por = u.id
            LEFT JOIN usuarios u2 ON a.modificado_por = u2.id
            WHERE a.id = ? AND a.empresa_id = ?`,
            [id, empresaId]
        )

        if (activos.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Activo no encontrado' }
        }

        const activo = activos[0]

        // Parsear JSON si existe
        if (activo.especificaciones_tecnicas) {
            try {
                activo.especificaciones_tecnicas = typeof activo.especificaciones_tecnicas === 'string' 
                    ? JSON.parse(activo.especificaciones_tecnicas)
                    : activo.especificaciones_tecnicas
            } catch (e) {
                activo.especificaciones_tecnicas = {}
            }
        }

        if (activo.documentos_json) {
            try {
                activo.documentos_json = typeof activo.documentos_json === 'string'
                    ? JSON.parse(activo.documentos_json)
                    : activo.documentos_json
            } catch (e) {
                activo.documentos_json = []
            }
        }

        connection.release()

        return {
            success: true,
            activo
        }

    } catch (error) {
        console.error('Error al obtener activo:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar activo' }
    }
}

/**
 * Obtiene productos rastreables para el selector
 * @returns {Object} { success: boolean, productos?: Array, mensaje?: string }
 */
export async function obtenerProductosRastreables() {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        const [productos] = await connection.execute(
            `SELECT 
                p.id,
                p.nombre,
                p.sku,
                p.precio_compra,
                p.precio_venta,
                p.ubicacion_bodega,
                c.nombre as categoria_nombre,
                m.nombre as marca_nombre
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            LEFT JOIN marcas m ON p.marca_id = m.id
            WHERE p.empresa_id = ? 
            AND p.es_rastreable = TRUE 
            AND p.activo = TRUE
            ORDER BY p.nombre ASC`,
            [empresaId]
        )

        connection.release()

        return {
            success: true,
            productos
        }

    } catch (error) {
        console.error('Error al obtener productos rastreables:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar productos', productos: [] }
    }
}

/**
 * Actualiza un activo existente
 * @param {number} id - ID del activo
 * @param {Object} datos - Datos a actualizar
 * @returns {Object} { success: boolean, mensaje?: string }
 */
export async function actualizarActivo(id, datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userId = cookieStore.get('userId')?.value

        if (!empresaId || !userId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        // Verificar que el activo existe
        const [activos] = await connection.execute(
            `SELECT id FROM activos_productos 
             WHERE id = ? AND empresa_id = ?`,
            [id, empresaId]
        )

        if (activos.length === 0) {
            await connection.rollback()
            connection.release()
            return { success: false, mensaje: 'Activo no encontrado' }
        }

        // Validar unicidad de número de serie por empresa (excluyendo el activo actual)
        if (datos.numero_serie) {
            const [existeSerie] = await connection.execute(
                `SELECT id FROM activos_productos WHERE numero_serie = ? AND empresa_id = ? AND id != ?`,
                [datos.numero_serie, empresaId, id]
            )

            if (existeSerie.length > 0) {
                await connection.rollback()
                connection.release()
                return {
                    success: false,
                    mensaje: 'El número de serie ya existe en otro activo'
                }
            }
        }

        // Helper function para convertir undefined/NaN a null
        const toNull = (value) => {
            if (value === undefined || value === null) return null
            if (typeof value === 'number' && isNaN(value)) return null
            if (typeof value === 'string' && value.trim() === '') return null
            return value
        }

        // Normalizar valores para evitar undefined/NaN
        const codigoActivo = toNull(datos.codigo_activo)
        const vin = toNull(datos.vin)
        const numeroMotor = toNull(datos.numero_motor)
        const numeroPlaca = toNull(datos.numero_placa)
        const color = toNull(datos.color)
        const anioFabricacion = toNull(datos.anio_fabricacion)
        const precioCompra = toNull(datos.precio_compra)
        const fechaCompra = toNull(datos.fecha_compra)
        const ubicacion = toNull(datos.ubicacion)
        const observaciones = toNull(datos.observaciones)
        const especificacionesTecnicas = datos.especificaciones_tecnicas ? JSON.stringify(datos.especificaciones_tecnicas) : null
        const documentosJson = datos.documentos_json ? JSON.stringify(datos.documentos_json) : null

        // Normalizar campos requeridos también
        const numeroSerie = datos.numero_serie ? datos.numero_serie.trim() : null
        const estado = datos.estado || 'en_stock'

        // Actualizar activo
        await connection.execute(
            `UPDATE activos_productos SET
                codigo_activo = ?,
                numero_serie = ?,
                vin = ?,
                numero_motor = ?,
                numero_placa = ?,
                color = ?,
                anio_fabricacion = ?,
                especificaciones_tecnicas = ?,
                estado = ?,
                fecha_compra = ?,
                precio_compra = ?,
                ubicacion = ?,
                documentos_json = ?,
                observaciones = ?,
                modificado_por = ?,
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id = ? AND empresa_id = ?`,
            [
                codigoActivo,
                numeroSerie,
                vin,
                numeroMotor,
                numeroPlaca,
                color,
                anioFabricacion,
                especificacionesTecnicas,
                estado,
                fechaCompra,
                precioCompra,
                ubicacion,
                documentosJson,
                observaciones,
                userId,
                id,
                empresaId
            ]
        )

        await connection.commit()
        connection.release()

        return { success: true, mensaje: 'Activo actualizado exitosamente' }

    } catch (error) {
        console.error('Error al actualizar activo:', error)
        
        if (connection) {
            await connection.rollback()
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al actualizar el activo'
        }
    }
}

