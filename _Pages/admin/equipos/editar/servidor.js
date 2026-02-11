"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import { guardarImagenProducto, eliminarImagenProducto } from '@/services/imageService'

export async function obtenerEquipo(equipoId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [equipos] = await connection.execute(
            `SELECT 
                id,
                codigo_barras,
                sku,
                nombre,
                descripcion,
                categoria_id,
                marca_id,
                unidad_medida_id,
                precio_compra,
                precio_venta,
                precio_oferta,
                precio_mayorista,
                cantidad_mayorista,
                stock,
                stock_minimo,
                stock_maximo,
                ubicacion_bodega,
                imagen_url,
                aplica_itbis,
                activo,
                es_rastreable,
                tipo_activo,
                requiere_serie,
                permite_financiamiento,
                meses_max_financiamiento,
                meses_garantia,
                tasa_depreciacion
            FROM productos 
            WHERE id = ? AND empresa_id = ? AND es_rastreable = TRUE`,
            [equipoId, empresaId]
        )

        if (equipos.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Equipo no encontrado o no es un producto rastreable'
            }
        }

        // Contar activos asociados y obtener stock real
        const [activos] = await connection.execute(
            `SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN estado = 'en_stock' THEN 1 END) as stock_disponible
            FROM activos_productos 
            WHERE producto_id = ?`,
            [equipoId]
        )

        const [categorias] = await connection.execute(
            `SELECT id, nombre FROM categorias WHERE empresa_id = ? AND activo = TRUE ORDER BY nombre ASC`,
            [empresaId]
        )

        const [marcas] = await connection.execute(
            `SELECT id, nombre FROM marcas WHERE empresa_id = ? AND activo = TRUE ORDER BY nombre ASC`,
            [empresaId]
        )

        const [unidadesMedida] = await connection.execute(
            `SELECT id, codigo, nombre, abreviatura FROM unidades_medida WHERE activo = TRUE ORDER BY nombre ASC`
        )

        const [empresa] = await connection.execute(
            `SELECT moneda, simbolo_moneda, impuesto_nombre, impuesto_porcentaje FROM empresas WHERE id = ?`,
            [empresaId]
        )

        connection.release()

        const configuracion = empresa.length > 0 ? {
            moneda: empresa[0].moneda || 'DOP',
            simbolo_moneda: empresa[0].simbolo_moneda || 'RD$',
            impuesto_nombre: empresa[0].impuesto_nombre || 'ITBIS',
            impuesto_porcentaje: empresa[0].impuesto_porcentaje !== undefined && empresa[0].impuesto_porcentaje !== null ? parseFloat(empresa[0].impuesto_porcentaje) : 0.00
        } : {
            moneda: 'DOP',
            simbolo_moneda: 'RD$',
            impuesto_nombre: 'ITBIS',
            impuesto_porcentaje: 0.00
        }

        // Actualizar el stock del equipo con el valor real de activos disponibles
        const equipoData = equipos[0]
        equipoData.stock = activos[0].stock_disponible || 0

        return {
            success: true,
            equipo: equipoData,
            totalActivos: activos[0].total,
            stockDisponible: activos[0].stock_disponible || 0,
            categorias: categorias,
            marcas: marcas,
            unidadesMedida: unidadesMedida,
            configuracion: configuracion
        }

    } catch (error) {
        console.error('Error al obtener equipo:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar equipo'
        }
    }
}

export async function actualizarEquipo(equipoId, datosEquipo) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para actualizar equipos'
            }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        // Verificar que el producto es rastreable
        const [equipoExistente] = await connection.execute(
            `SELECT id, imagen_url, es_rastreable FROM productos WHERE id = ? AND empresa_id = ?`,
            [equipoId, empresaId]
        )

        if (equipoExistente.length === 0) {
            await connection.rollback()
            connection.release()
            return {
                success: false,
                mensaje: 'Equipo no encontrado'
            }
        }

        if (!equipoExistente[0].es_rastreable) {
            await connection.rollback()
            connection.release()
            return {
                success: false,
                mensaje: 'Este producto no es un equipo rastreable'
            }
        }

        // Validar que tipo_activo no sea 'no_rastreable'
        if (datosEquipo.tipo_activo === 'no_rastreable') {
            await connection.rollback()
            connection.release()
            return {
                success: false,
                mensaje: 'El tipo de activo no puede ser "no_rastreable" para equipos'
            }
        }

        // Verificar si tiene activos asociados antes de cambiar es_rastreable
        const [activos] = await connection.execute(
            `SELECT COUNT(*) as total FROM activos_productos WHERE producto_id = ?`,
            [equipoId]
        )

        if (activos[0].total > 0 && datosEquipo.es_rastreable === false) {
            await connection.rollback()
            connection.release()
            return {
                success: false,
                mensaje: `No se puede cambiar a no rastreable porque tiene ${activos[0].total} activo(s) asociado(s)`
            }
        }

        const imagenAnterior = equipoExistente[0].imagen_url

        let codigoBarrasFinal = datosEquipo.codigo_barras
        let skuFinal = datosEquipo.sku

        if (codigoBarrasFinal) {
            const [existeCodigo] = await connection.execute(
                `SELECT id FROM productos WHERE codigo_barras = ? AND empresa_id = ? AND id != ?`,
                [codigoBarrasFinal, empresaId, equipoId]
            )

            if (existeCodigo.length > 0) {
                await connection.rollback()
                connection.release()
                return {
                    success: false,
                    mensaje: 'El codigo de barras ya existe en otro producto'
                }
            }
        }

        if (skuFinal) {
            const [existeSku] = await connection.execute(
                `SELECT id FROM productos WHERE sku = ? AND empresa_id = ? AND id != ?`,
                [skuFinal, empresaId, equipoId]
            )

            if (existeSku.length > 0) {
                await connection.rollback()
                connection.release()
                return {
                    success: false,
                    mensaje: 'El SKU ya existe en otro producto'
                }
            }
        }

        let imagenFinal = datosEquipo.imagen_url || imagenAnterior || null

        // Si hay una nueva imagen base64, guardarla localmente
        if (datosEquipo.imagen_base64 && !datosEquipo.imagen_url) {
            try {
                imagenFinal = await guardarImagenProducto(datosEquipo.imagen_base64, equipoId)
                
                if (imagenAnterior && imagenAnterior.startsWith('/images/productos/')) {
                    await eliminarImagenProducto(imagenAnterior)
                }
            } catch (error) {
                await connection.rollback()
                connection.release()
                return {
                    success: false,
                    mensaje: 'Error al guardar la imagen del equipo: ' + error.message
                }
            }
        }

        await connection.execute(
            `UPDATE productos SET
                codigo_barras = ?,
                sku = ?,
                nombre = ?,
                descripcion = ?,
                categoria_id = ?,
                marca_id = ?,
                unidad_medida_id = ?,
                precio_compra = ?,
                precio_venta = ?,
                precio_oferta = ?,
                precio_mayorista = ?,
                cantidad_mayorista = ?,
                stock_minimo = ?,
                stock_maximo = ?,
                ubicacion_bodega = ?,
                imagen_url = ?,
                aplica_itbis = ?,
                activo = ?,
                tipo_activo = ?,
                permite_financiamiento = ?,
                meses_max_financiamiento = ?,
                meses_garantia = ?,
                tasa_depreciacion = ?,
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id = ? AND empresa_id = ?`,
            [
                codigoBarrasFinal,
                skuFinal,
                datosEquipo.nombre,
                datosEquipo.descripcion,
                datosEquipo.categoria_id,
                datosEquipo.marca_id,
                datosEquipo.unidad_medida_id,
                datosEquipo.precio_compra,
                datosEquipo.precio_venta,
                datosEquipo.precio_oferta,
                datosEquipo.precio_mayorista,
                datosEquipo.cantidad_mayorista,
                datosEquipo.stock_minimo || 5,
                datosEquipo.stock_maximo || 100,
                datosEquipo.ubicacion_bodega,
                imagenFinal,
                datosEquipo.aplica_itbis,
                datosEquipo.activo,
                datosEquipo.tipo_activo,
                datosEquipo.permite_financiamiento,
                datosEquipo.meses_max_financiamiento,
                datosEquipo.meses_garantia,
                datosEquipo.tasa_depreciacion,
                equipoId,
                empresaId
            ]
        )

        await connection.commit()
        connection.release()

        return {
            success: true,
            mensaje: 'Equipo actualizado exitosamente'
        }

    } catch (error) {
        console.error('Error al actualizar equipo:', error)
        
        if (connection) {
            await connection.rollback()
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al actualizar el equipo'
        }
    }
}

