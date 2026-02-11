"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import { existeImagenLocal } from '@/services/imageService'

export async function obtenerDetalleEquipo(equipoId) {
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

        const [equipo] = await connection.execute(
            `SELECT 
                p.*,
                c.nombre as categoria_nombre,
                m.nombre as marca_nombre,
                um.nombre as unidad_medida_nombre,
                um.abreviatura as unidad_medida_abreviatura
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            LEFT JOIN marcas m ON p.marca_id = m.id
            LEFT JOIN unidades_medida um ON p.unidad_medida_id = um.id
            WHERE p.id = ? AND p.empresa_id = ? AND p.es_rastreable = TRUE`,
            [equipoId, empresaId]
        )

        if (equipo.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Equipo no encontrado o no es un producto rastreable'
            }
        }

        // Obtener lista de activos asociados
        const [activos] = await connection.execute(
            `SELECT 
                ap.*,
                c.nombre as cliente_nombre,
                c.numero_documento as cliente_documento,
                cf.numero_contrato,
                u.nombre as creado_por_nombre
            FROM activos_productos ap
            LEFT JOIN clientes c ON ap.cliente_id = c.id
            LEFT JOIN contratos_financiamiento cf ON ap.contrato_financiamiento_id = cf.id
            LEFT JOIN usuarios u ON ap.creado_por = u.id
            WHERE ap.producto_id = ? AND ap.empresa_id = ?
            ORDER BY ap.estado, ap.numero_serie ASC`,
            [equipoId, empresaId]
        )

        connection.release()

        // Validar que la imagen existe si es local
        const equipoData = equipo[0]
        
        if (equipoData.imagen_url && equipoData.imagen_url.startsWith('/images/')) {
            const existe = await existeImagenLocal(equipoData.imagen_url)
            if (!existe) {
                console.warn(`Imagen no encontrada físicamente: ${equipoData.imagen_url}`)
                equipoData.imagen_url = null
            }
        }

        return {
            success: true,
            equipo: equipoData,
            activos: activos
        }

    } catch (error) {
        console.error('Error al obtener detalle del equipo:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar datos del equipo'
        }
    }
}

export async function crearActivo(datosActivo) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para crear activos'
            }
        }

        const productoId = datosActivo.producto_id

        if (!productoId) {
            return {
                success: false,
                mensaje: 'El producto_id es requerido'
            }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        // Verificar que el producto es rastreable
        const [producto] = await connection.execute(
            `SELECT id, es_rastreable FROM productos WHERE id = ? AND empresa_id = ?`,
            [productoId, empresaId]
        )

        if (producto.length === 0 || !producto[0].es_rastreable) {
            await connection.rollback()
            connection.release()
            return {
                success: false,
                mensaje: 'El producto no es un equipo rastreable'
            }
        }

        // Validar unicidad de número de serie por empresa
        if (datosActivo.numero_serie) {
            const [existeSerie] = await connection.execute(
                `SELECT id FROM activos_productos WHERE numero_serie = ? AND empresa_id = ?`,
                [datosActivo.numero_serie, empresaId]
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

        // Generar código de activo automático si no se proporciona
        let codigoActivo = datosActivo.codigo_activo
        if (!codigoActivo) {
            const prefijo = 'ACT'
            const timestamp = Date.now().toString().slice(-6)
            codigoActivo = `${prefijo}-${timestamp}`
        }

        // Insertar activo
        const [resultado] = await connection.execute(
            `INSERT INTO activos_productos (
                empresa_id,
                producto_id,
                codigo_activo,
                numero_serie,
                vin,
                numero_motor,
                numero_placa,
                color,
                anio_fabricacion,
                especificaciones_tecnicas,
                estado,
                fecha_compra,
                precio_compra,
                ubicacion,
                documentos_json,
                observaciones,
                creado_por
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                empresaId,
                productoId,
                codigoActivo,
                datosActivo.numero_serie,
                datosActivo.vin || null,
                datosActivo.numero_motor || null,
                datosActivo.numero_placa || null,
                datosActivo.color || null,
                datosActivo.anio_fabricacion || null,
                datosActivo.especificaciones_tecnicas ? JSON.stringify(datosActivo.especificaciones_tecnicas) : null,
                datosActivo.estado || 'en_stock',
                datosActivo.fecha_compra || null,
                datosActivo.precio_compra || null,
                datosActivo.ubicacion || null,
                datosActivo.documentos_json ? JSON.stringify(datosActivo.documentos_json) : null,
                datosActivo.observaciones || null,
                userId
            ]
        )

        await connection.commit()
        connection.release()

        return {
            success: true,
            mensaje: 'Activo creado exitosamente',
            activoId: resultado.insertId
        }

    } catch (error) {
        console.error('Error al crear activo:', error)
        
        if (connection) {
            await connection.rollback()
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al crear el activo'
        }
    }
}

// Helper function para convertir undefined/NaN a null
function toNull(value) {
    // Si es undefined o null, retornar null
    if (value === undefined || value === null) {
        return null
    }
    // Si es NaN, retornar null
    if (typeof value === 'number' && isNaN(value)) {
        return null
    }
    // Si es string vacío, retornar null
    if (typeof value === 'string' && value.trim() === '') {
        return null
    }
    // Si es 0 (número válido), mantenerlo
    // Si es string "0", mantenerlo
    return value
}

export async function actualizarActivo(activoId, datosActivo) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para actualizar activos'
            }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        // Validar unicidad de número de serie por empresa (excluyendo el activo actual)
        if (datosActivo.numero_serie) {
            const [existeSerie] = await connection.execute(
                `SELECT id FROM activos_productos WHERE numero_serie = ? AND empresa_id = ? AND id != ?`,
                [datosActivo.numero_serie, empresaId, activoId]
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

        // Normalizar valores para evitar undefined/NaN
        const codigoActivo = toNull(datosActivo.codigo_activo)
        const vin = toNull(datosActivo.vin)
        const numeroMotor = toNull(datosActivo.numero_motor)
        const numeroPlaca = toNull(datosActivo.numero_placa)
        const color = toNull(datosActivo.color)
        const anioFabricacion = toNull(datosActivo.anio_fabricacion)
        const precioCompra = toNull(datosActivo.precio_compra)
        const fechaCompra = toNull(datosActivo.fecha_compra)
        const ubicacion = toNull(datosActivo.ubicacion)
        const observaciones = toNull(datosActivo.observaciones)
        const especificacionesTecnicas = datosActivo.especificaciones_tecnicas ? JSON.stringify(datosActivo.especificaciones_tecnicas) : null
        const documentosJson = datosActivo.documentos_json ? JSON.stringify(datosActivo.documentos_json) : null

        // Normalizar campos requeridos también
        const numeroSerie = datosActivo.numero_serie ? datosActivo.numero_serie.trim() : null
        const estado = datosActivo.estado || 'en_stock'

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
                activoId,
                empresaId
            ]
        )

        await connection.commit()
        connection.release()

        return {
            success: true,
            mensaje: 'Activo actualizado exitosamente'
        }

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

export async function crearActivosMultiples(activosACrear) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para crear activos'
            }
        }

        if (!Array.isArray(activosACrear) || activosACrear.length === 0) {
            return {
                success: false,
                mensaje: 'Debe proporcionar al menos un activo para crear'
            }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        // Verificar que todos los activos pertenecen al mismo producto y es rastreable
        const productoId = activosACrear[0].producto_id
        const [producto] = await connection.execute(
            `SELECT id, es_rastreable FROM productos WHERE id = ? AND empresa_id = ?`,
            [productoId, empresaId]
        )

        if (producto.length === 0 || !producto[0].es_rastreable) {
            await connection.rollback()
            connection.release()
            return {
                success: false,
                mensaje: 'El producto no es un equipo rastreable'
            }
        }

        // Validar que todos los números de serie sean únicos y no existan
        const numerosSerie = activosACrear.map(a => a.numero_serie).filter(Boolean)
        if (numerosSerie.length > 0) {
            const [existentes] = await connection.execute(
                `SELECT numero_serie FROM activos_productos 
                 WHERE numero_serie IN (${numerosSerie.map(() => '?').join(',')}) 
                 AND empresa_id = ?`,
                [...numerosSerie, empresaId]
            )

            if (existentes.length > 0) {
                await connection.rollback()
                connection.release()
                return {
                    success: false,
                    mensaje: `Los siguientes números de serie ya existen: ${existentes.map(e => e.numero_serie).join(', ')}`
                }
            }
        }

        // Crear todos los activos
        let creados = 0
        const errores = []

        for (const datosActivo of activosACrear) {
            try {
                // Generar código de activo automático si no se proporciona
                let codigoActivo = datosActivo.codigo_activo
                if (!codigoActivo) {
                    const prefijo = 'ACT'
                    const timestamp = Date.now().toString().slice(-6)
                    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
                    codigoActivo = `${prefijo}-${timestamp}-${random}`
                }

                // Insertar activo
                await connection.execute(
                    `INSERT INTO activos_productos (
                        empresa_id,
                        producto_id,
                        codigo_activo,
                        numero_serie,
                        vin,
                        numero_motor,
                        numero_placa,
                        color,
                        anio_fabricacion,
                        especificaciones_tecnicas,
                        estado,
                        fecha_compra,
                        precio_compra,
                        ubicacion,
                        documentos_json,
                        observaciones,
                        creado_por
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        empresaId,
                        productoId,
                        codigoActivo,
                        datosActivo.numero_serie || null,
                        datosActivo.vin || null,
                        datosActivo.numero_motor || null,
                        datosActivo.numero_placa || null,
                        datosActivo.color || null,
                        datosActivo.anio_fabricacion || null,
                        datosActivo.especificaciones_tecnicas ? JSON.stringify(datosActivo.especificaciones_tecnicas) : null,
                        datosActivo.estado || 'en_stock',
                        datosActivo.fecha_compra || null,
                        datosActivo.precio_compra || null,
                        datosActivo.ubicacion || null,
                        datosActivo.documentos_json ? JSON.stringify(datosActivo.documentos_json) : null,
                        datosActivo.observaciones || null,
                        userId
                    ]
                )
                creados++
            } catch (error) {
                errores.push(`Error al crear activo con serie ${datosActivo.numero_serie || 'N/A'}: ${error.message}`)
            }
        }

        if (errores.length > 0 && creados === 0) {
            // Si todos fallaron, hacer rollback
            await connection.rollback()
            connection.release()
            return {
                success: false,
                mensaje: `Error al crear activos: ${errores.join('; ')}`
            }
        }

        await connection.commit()
        connection.release()

        return {
            success: true,
            mensaje: creados === activosACrear.length 
                ? `${creados} activos creados exitosamente`
                : `${creados} de ${activosACrear.length} activos creados exitosamente. Errores: ${errores.join('; ')}`,
            cantidad: creados
        }

    } catch (error) {
        console.error('Error al crear activos múltiples:', error)
        
        if (connection) {
            await connection.rollback()
            connection.release()
        }

        return {
            success: false,
            mensaje: error.message || 'Error al crear los activos'
        }
    }
}

export async function eliminarActivo(activoId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para eliminar activos'
            }
        }

        connection = await db.getConnection()

        // Verificar estado del activo
        const [activo] = await connection.execute(
            `SELECT estado FROM activos_productos WHERE id = ? AND empresa_id = ?`,
            [activoId, empresaId]
        )

        if (activo.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Activo no encontrado'
            }
        }

        // No permitir eliminar activos financiados o vendidos
        if (activo[0].estado === 'financiado' || activo[0].estado === 'vendido') {
            connection.release()
            return {
                success: false,
                mensaje: `No se puede eliminar un activo con estado "${activo[0].estado}"`
            }
        }

        // Cambiar estado a 'dado_baja' en lugar de eliminar físicamente
        await connection.execute(
            `UPDATE activos_productos SET estado = 'dado_baja', modificado_por = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ? AND empresa_id = ?`,
            [userId, activoId, empresaId]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Activo dado de baja exitosamente'
        }

    } catch (error) {
        console.error('Error al eliminar activo:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al eliminar el activo'
        }
    }
}

