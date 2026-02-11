"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import { guardarImagenProducto } from '@/services/imageService'

export async function obtenerDatosEquipo() {
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

        const [categorias] = await connection.execute(
            `SELECT id, nombre FROM categorias WHERE empresa_id = ? AND activo = TRUE ORDER BY nombre ASC`,
            [empresaId]
        )

        const [marcas] = await connection.execute(
            `SELECT id, nombre FROM marcas WHERE empresa_id = ? AND activo = TRUE ORDER BY nombre ASC`,
            [empresaId]
        )

        // Buscar unidad de medida "UN" (Unidad)
        const [unidadesMedida] = await connection.execute(
            `SELECT id, codigo, nombre, abreviatura FROM unidades_medida WHERE activo = TRUE ORDER BY nombre ASC`
        )

        // Buscar unidad "UN" específicamente
        const unidadUN = unidadesMedida.find(um => um.codigo === 'UN' || um.abreviatura === 'UN')

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

        return {
            success: true,
            categorias: categorias,
            marcas: marcas,
            unidadesMedida: unidadesMedida,
            unidadUNId: unidadUN ? unidadUN.id : null,
            configuracion: configuracion
        }

    } catch (error) {
        console.error('Error al obtener datos de equipo:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar datos'
        }
    }
}

export async function crearEquipo(datosEquipo) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para crear equipos'
            }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        // Validar que tipo_activo no sea 'no_rastreable'
        if (datosEquipo.tipo_activo === 'no_rastreable') {
            await connection.rollback()
            connection.release()
            return {
                success: false,
                mensaje: 'El tipo de activo no puede ser "no_rastreable" para equipos'
            }
        }

        // Validar que unidad_medida_id sea válida
        if (!datosEquipo.unidad_medida_id) {
            await connection.rollback()
            connection.release()
            return {
                success: false,
                mensaje: 'Debe seleccionar una unidad de medida'
            }
        }

        let codigoBarrasFinal = datosEquipo.codigo_barras
        let skuFinal = datosEquipo.sku

        if (codigoBarrasFinal) {
            let intento = 0
            let existe = true
            
            while (existe && intento < 10) {
                const [existeCodigo] = await connection.execute(
                    `SELECT id FROM productos WHERE codigo_barras = ? AND empresa_id = ?`,
                    [codigoBarrasFinal, empresaId]
                )

                if (existeCodigo.length > 0) {
                    const randomNum = Math.floor(Math.random() * 900000000000) + 100000000000
                    codigoBarrasFinal = randomNum.toString()
                    intento++
                } else {
                    existe = false
                }
            }

            if (existe) {
                await connection.rollback()
                connection.release()
                return {
                    success: false,
                    mensaje: 'No se pudo generar un codigo de barras unico'
                }
            }
        }

        if (skuFinal) {
            let intento = 0
            let existe = true
            
            while (existe && intento < 10) {
                const [existeSku] = await connection.execute(
                    `SELECT id FROM productos WHERE sku = ? AND empresa_id = ?`,
                    [skuFinal, empresaId]
                )

                if (existeSku.length > 0) {
                    const prefijo = datosEquipo.nombre.substring(0, 3).toUpperCase().replace(/\s/g, '')
                    const randomNum = Math.floor(Math.random() * 9000) + 1000
                    skuFinal = `${prefijo}-${randomNum}`
                    intento++
                } else {
                    existe = false
                }
            }

            if (existe) {
                await connection.rollback()
                connection.release()
                return {
                    success: false,
                    mensaje: 'No se pudo generar un SKU unico'
                }
            }
        }

        // Crear producto rastreable (equipo)
        const [resultado] = await connection.execute(
            `INSERT INTO productos (
                empresa_id,
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
                imagen_url,
                aplica_itbis,
                activo,
                es_rastreable,
                tipo_activo,
                requiere_serie,
                permite_financiamiento,
                meses_max_financiamiento,
                meses_garantia,
                tasa_depreciacion,
                fecha_vencimiento,
                lote,
                ubicacion_bodega
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                empresaId,
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
                0, // stock = 0 para productos rastreables (se calcula desde activos)
                datosEquipo.stock_minimo || 5, // stock_minimo para alertas
                datosEquipo.stock_maximo || 100, // stock_maximo para alertas
                datosEquipo.imagen_url || null,
                datosEquipo.aplica_itbis,
                datosEquipo.activo,
                true, // es_rastreable = TRUE
                datosEquipo.tipo_activo,
                true, // requiere_serie = TRUE
                datosEquipo.permite_financiamiento !== undefined ? datosEquipo.permite_financiamiento : true,
                datosEquipo.meses_max_financiamiento,
                datosEquipo.meses_garantia,
                datosEquipo.tasa_depreciacion,
                datosEquipo.fecha_vencimiento,
                datosEquipo.lote,
                datosEquipo.ubicacion_bodega
            ]
        )

        // Guardar imagen local si existe imagen_base64
        if (datosEquipo.imagen_base64 && !datosEquipo.imagen_url) {
            try {
                const productoId = resultado.insertId
                const imagenFinal = await guardarImagenProducto(datosEquipo.imagen_base64, productoId)
                
                // Actualizar producto con la ruta de la imagen
                await connection.execute(
                    `UPDATE productos SET imagen_url = ? WHERE id = ? AND empresa_id = ?`,
                    [imagenFinal, productoId, empresaId]
                )
            } catch (error) {
                await connection.rollback()
                connection.release()
                return {
                    success: false,
                    mensaje: 'Error al guardar la imagen del equipo: ' + error.message
                }
            }
        }

        await connection.commit()
        connection.release()

        return {
            success: true,
            mensaje: 'Equipo creado exitosamente',
            equipoId: resultado.insertId
        }

    } catch (error) {
        console.error('Error al crear equipo:', error)
        
        if (connection) {
            await connection.rollback()
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al crear el equipo'
        }
    }
}

