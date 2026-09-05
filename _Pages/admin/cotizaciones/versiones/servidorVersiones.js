"use server"

import db from "@/_DB/db"
import {cookies} from 'next/headers'
import {registrarHistorial} from "@/_Pages/admin/cotizaciones/historial/servidor";

/**
 * Crea una nueva versión de una cotización
 */
export async function crearVersionCotizacion(cotizacionId, motivo) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return {success: false, mensaje: 'Sesión inválida'}
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        // 1. Obtener cotización actual
        const [cot] = await connection.execute(
            `SELECT *
             FROM cotizaciones
             WHERE id = ?
               AND empresa_id = ?`,
            [cotizacionId, empresaId]
        )

        if (cot.length === 0) {
            await connection.rollback()
            connection.release()
            return {success: false, mensaje: 'Cotización no encontrada'}
        }

        const cotizacion = cot[0]

        // 2. Obtener detalle actual
        const [detalle] = await connection.execute(
            `SELECT *
             FROM cotizacion_detalle
             WHERE cotizacion_id = ?`,
            [cotizacionId]
        )

        // 3. Obtener siguiente número de versión
        const [versiones] = await connection.execute(
            `SELECT MAX(version_numero) as max_version
             FROM cotizacion_versiones
             WHERE cotizacion_id = ?`,
            [cotizacionId]
        )
        const nuevaVersion = (versiones[0].max_version || cotizacion.version_actual || 0) + 1

        // 4. Guardar snapshot
        await connection.execute(
            `INSERT INTO cotizacion_versiones
             (cotizacion_id, version_numero, usuario_id,
              estado_snapshot, total_snapshot, observaciones_snapshot,
              detalle_json, motivo_version)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                cotizacionId,
                nuevaVersion,
                userId,
                cotizacion.estado,
                cotizacion.total,
                cotizacion.observaciones,
                JSON.stringify(detalle),
                motivo
            ]
        )

        // 5. Actualizar versión actual
        await connection.execute(
            `UPDATE cotizaciones
             SET version_actual = ?
             WHERE id = ?`,
            [nuevaVersion, cotizacionId]
        )

        // 6. Registrar en historial
        await registrarHistorial(
            cotizacionId,
            'version_creada',
            'version_actual',
            cotizacion.version_actual?.toString() || '1',
            nuevaVersion.toString(),
            motivo || 'Versión creada automáticamente'
        )

        await connection.commit()
        connection.release()

        return {success: true, version: nuevaVersion}

    } catch (error) {
        console.error('Error al crear versión:', error)
        if (connection) {
            await connection.rollback()
            connection.release()
        }
        return {success: false, mensaje: 'Error al crear versión'}
    }
}

/**
 * Obtiene todas las versiones de una cotización
 */
export async function obtenerVersiones(cotizacionId) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return {success: false, mensaje: 'Sesión inválida'}

        connection = await db.getConnection()

        const [versiones] = await connection.execute(
            `SELECT v.*,
                    u.nombre as usuario_nombre
             FROM cotizacion_versiones v
                      LEFT JOIN usuarios u ON v.usuario_id = u.id
             WHERE v.cotizacion_id = ?
             ORDER BY v.version_numero DESC`,
            [cotizacionId]
        )

        connection.release()
        return {success: true, versiones}

    } catch (error) {
        console.error('Error al obtener versiones:', error)
        if (connection) connection.release()
        return {success: false, mensaje: 'Error al cargar versiones'}
    }
}

/**
 * Obtiene una versión específica
 */
export async function obtenerVersion(cotizacionId, versionNumero) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return {success: false, mensaje: 'Sesión inválida'}

        connection = await db.getConnection()

        const [version] = await connection.execute(
            `SELECT v.*,
                    u.nombre as usuario_nombre
             FROM cotizacion_versiones v
                      LEFT JOIN usuarios u ON v.usuario_id = u.id
             WHERE v.cotizacion_id = ?
               AND v.version_numero = ?`,
            [cotizacionId, versionNumero]
        )

        if (version.length === 0) {
            connection.release()
            return {success: false, mensaje: 'Versión no encontrada'}
        }

        const detalle = JSON.parse(version[0].detalle_json)

        connection.release()
        return {success: true, version: version[0], detalle}

    } catch (error) {
        console.error('Error al obtener versión:', error)
        if (connection) connection.release()
        return {success: false, mensaje: 'Error al cargar versión'}
    }
}

/**
 * Compara dos versiones de una cotización
 */
export async function compararVersiones(cotizacionId, version1, version2) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return {success: false, mensaje: 'Sesión inválida'}

        connection = await db.getConnection()

        // Obtener ambas versiones
        const [v1] = await connection.execute(
            `SELECT *
             FROM cotizacion_versiones
             WHERE cotizacion_id = ?
               AND version_numero = ?`,
            [cotizacionId, version1]
        )

        const [v2] = await connection.execute(
            `SELECT *
             FROM cotizacion_versiones
             WHERE cotizacion_id = ?
               AND version_numero = ?`,
            [cotizacionId, version2]
        )

        if (v1.length === 0 || v2.length === 0) {
            connection.release()
            return {success: false, mensaje: 'Una o ambas versiones no encontradas'}
        }

        const detalle1 = JSON.parse(v1[0].detalle_json)
        const detalle2 = JSON.parse(v2[0].detalle_json)

        // Calcular diferencias
        const cambios = calcularDiferencias(detalle1, detalle2)

        connection.release()
        return {
            success: true,
            version1: v1[0],
            version2: v2[0],
            cambios
        }

    } catch (error) {
        console.error('Error al comparar versiones:', error)
        if (connection) connection.release()
        return {success: false, mensaje: 'Error al comparar versiones'}
    }
}

/**
 * Calcula las diferencias entre dos detalles
 */
function calcularDiferencias(detalle1, detalle2) {
    const cambios = {
        productos_agregados: [],
        productos_eliminados: [],
        productos_modificados: [],
        total_cambio: 0
    }

    // Crear mapas por producto_id
    const map1 = new Map(detalle1.map(p => [p.producto_id, p]))
    const map2 = new Map(detalle2.map(p => [p.producto_id, p]))

    // Productos eliminados
    for (const [productoId, producto] of map1) {
        if (!map2.has(productoId)) {
            cambios.productos_eliminados.push(producto)
        }
    }

    // Productos agregados y modificados
    for (const [productoId, producto2] of map2) {
        if (!map1.has(productoId)) {
            cambios.productos_agregados.push(producto2)
        } else {
            const producto1 = map1.get(productoId)
            const modificaciones = {}

            if (producto1.cantidad !== producto2.cantidad) {
                modificaciones.cantidad = {
                    anterior: producto1.cantidad,
                    nuevo: producto2.cantidad
                }
            }
            if (producto1.precio_unitario !== producto2.precio_unitario) {
                modificaciones.precio_unitario = {
                    anterior: producto1.precio_unitario,
                    nuevo: producto2.precio_unitario
                }
            }
            if (producto1.total !== producto2.total) {
                modificaciones.total = {
                    anterior: producto1.total,
                    nuevo: producto2.total
                }
            }

            if (Object.keys(modificaciones).length > 0) {
                cambios.productos_modificados.push({
                    producto: producto2,
                    modificaciones
                })
            }
        }
    }

    // Calcular cambio total
    const total1 = detalle1.reduce((sum, p) => sum + parseFloat(p.total || 0), 0)
    const total2 = detalle2.reduce((sum, p) => sum + parseFloat(p.total || 0), 0)
    cambios.total_cambio = total2 - total1

    return cambios
}




