"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

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
 * Crea un nuevo activo rastreable
 * @param {Object} datos - Datos del activo
 * @returns {Object} { success: boolean, activo_id?: number, mensaje?: string }
 */
export async function crearActivo(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userId = cookieStore.get('userId')?.value

        if (!empresaId || !userId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        // Validaciones básicas
        if (!datos.producto_id) {
            return { success: false, mensaje: 'El producto es requerido' }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        // Verificar que el producto es rastreable
        const [producto] = await connection.execute(
            `SELECT id, es_rastreable, ubicacion_bodega, precio_compra FROM productos WHERE id = ? AND empresa_id = ?`,
            [datos.producto_id, empresaId]
        )

        if (producto.length === 0 || !producto[0].es_rastreable) {
            await connection.rollback()
            connection.release()
            return {
                success: false,
                mensaje: 'El producto no es un equipo rastreable'
            }
        }

        // Generar código de activo si no se proporciona
        let codigoActivo = datos.codigo_activo
        if (!codigoActivo) {
            const [ultimoActivo] = await connection.execute(
                `SELECT codigo_activo FROM activos_productos
                 WHERE empresa_id = ?
                 ORDER BY id DESC LIMIT 1`,
                [empresaId]
            )

            let secuencia = 1
            if (ultimoActivo.length > 0) {
                const ultimoCod = ultimoActivo[0].codigo_activo
                const match = ultimoCod.match(/ACT-(\d+)/)
                if (match) {
                    secuencia = parseInt(match[1]) + 1
                }
            }

            codigoActivo = `ACT-${String(secuencia).padStart(6, '0')}`
        }

        // Validar unicidad de número de serie si se proporciona
        if (datos.numero_serie) {
            const [serieExistente] = await connection.execute(
                `SELECT id FROM activos_productos
                 WHERE numero_serie = ? AND empresa_id = ?`,
                [datos.numero_serie, empresaId]
            )

            if (serieExistente.length > 0) {
                await connection.rollback()
                connection.release()
                return { success: false, mensaje: 'El número de serie ya existe en otro activo' }
            }
        }

        // Insertar activo
        const [result] = await connection.execute(
            `INSERT INTO activos_productos (
                empresa_id, producto_id, codigo_activo, numero_serie,
                vin, numero_motor, numero_placa, color, anio_fabricacion,
                especificaciones_tecnicas, estado, fecha_compra, precio_compra,
                ubicacion, documentos_json, observaciones, creado_por
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                empresaId,
                datos.producto_id,
                codigoActivo,
                datos.numero_serie || null,
                datos.vin || null,
                datos.numero_motor || null,
                datos.numero_placa || null,
                datos.color || null,
                datos.anio_fabricacion || null,
                datos.especificaciones_tecnicas ? JSON.stringify(datos.especificaciones_tecnicas) : null,
                datos.estado || 'en_stock',
                datos.fecha_compra || null,
                datos.precio_compra || null,
                datos.ubicacion || producto[0].ubicacion_bodega || null,
                datos.documentos_json ? JSON.stringify(datos.documentos_json) : null,
                datos.observaciones || null,
                userId
            ]
        )

        await connection.commit()
        connection.release()

        return {
            success: true,
            activo_id: result.insertId,
            codigo_activo: codigoActivo,
            mensaje: 'Activo creado exitosamente'
        }

    } catch (error) {
        console.error('Error al crear activo:', error)
        
        if (connection) {
            await connection.rollback()
            connection.release()
        }

        return { success: false, mensaje: 'Error al crear activo' }
    }
}

