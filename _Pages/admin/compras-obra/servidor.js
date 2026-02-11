"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import { obtenerObras } from '../obras/servidor'
import fs from 'fs/promises'
import path from 'path'

export async function obtenerComprasObra(filtros = {}) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()
        
        let query = `
            SELECT co.*,
                   o.nombre AS obra_nombre,
                   o.codigo_obra,
                   p.nombre_comercial AS proveedor_nombre,
                   COUNT(cod.id) as cantidad_items
            FROM compras_obra co
            LEFT JOIN obras o ON co.tipo_destino = 'obra' AND co.destino_id = o.id
            LEFT JOIN proveedores p ON co.proveedor_id = p.id
            LEFT JOIN compras_obra_detalle cod ON co.id = cod.compra_obra_id
            WHERE co.empresa_id = ?
        `
        const params = [empresaId]
        
        if (filtros.obra_id) {
            query += ' AND co.tipo_destino = "obra" AND co.destino_id = ?'
            params.push(filtros.obra_id)
        }
        
        if (filtros.estado) {
            query += ' AND co.estado = ?'
            params.push(filtros.estado)
        }
        
        if (filtros.tipo_compra) {
            query += ' AND co.tipo_compra = ?'
            params.push(filtros.tipo_compra)
        }
        
        if (filtros.fecha_desde) {
            query += ' AND co.fecha_compra >= ?'
            params.push(filtros.fecha_desde)
        }
        
        if (filtros.fecha_hasta) {
            query += ' AND co.fecha_compra <= ?'
            params.push(filtros.fecha_hasta)
        }
        
        query += ' GROUP BY co.id ORDER BY co.fecha_compra DESC'
        
        const [compras] = await connection.query(query, params)
        connection.release()
        
        return { success: true, compras }
    } catch (error) {
        console.error('Error al obtener compras de obra:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar compras' }
    }
}

export async function obtenerCompraObraPorId(id) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()
        
        // Obtener compra
        const [compras] = await connection.query(
            `SELECT co.*,
                    o.nombre AS obra_nombre,
                    o.codigo_obra,
                    p.nombre_comercial AS proveedor_nombre
             FROM compras_obra co
             LEFT JOIN obras o ON co.tipo_destino = 'obra' AND co.destino_id = o.id
             LEFT JOIN proveedores p ON co.proveedor_id = p.id
             WHERE co.id = ? AND co.empresa_id = ?`,
            [id, empresaId]
        )
        
        if (compras.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Compra no encontrada' }
        }
        
        // Obtener detalle
        const [detalle] = await connection.query(
            'SELECT * FROM compras_obra_detalle WHERE compra_obra_id = ?',
            [id]
        )
        
        connection.release()
        
        return { 
            success: true, 
            compra: { ...compras[0], detalle } 
        }
    } catch (error) {
        console.error('Error al obtener compra:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar compra' }
    }
}

export async function crearCompraObra(datos) {
    let connection
    try {
        // #region agent log
        await fetch('http://127.0.0.1:7242/ingest/105a53c3-dc11-4849-aa2d-b5ff204596b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'servidor.js:122',message:'crearCompraObra ENTRY',data:{tipo_destino:datos?.tipo_destino,destino_id:datos?.destino_id,proveedor_id:datos?.proveedor_id,numero_factura:datos?.numero_factura,detalleCount:datos?.detalle?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,D'})}).catch(()=>{});
        // #endregion
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        // #region agent log
        await fetch('http://127.0.0.1:7242/ingest/105a53c3-dc11-4849-aa2d-b5ff204596b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'servidor.js:129',message:'crearCompraObra SESSION CHECK',data:{userId:userId||'MISSING',empresaId:empresaId||'MISSING'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion

        if (!userId || !empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        // Validaciones básicas
        if (!datos.proveedor_id) {
            // #region agent log
            await fetch('http://127.0.0.1:7242/ingest/105a53c3-dc11-4849-aa2d-b5ff204596b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'servidor.js:134',message:'crearCompraObra VALIDATION FAIL proveedor_id',data:{proveedor_id:datos?.proveedor_id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            return { success: false, mensaje: 'Debe seleccionar un proveedor' }
        }
        
        // Validar destino según tipo
        if (!datos.tipo_destino) {
            // #region agent log
            await fetch('http://127.0.0.1:7242/ingest/105a53c3-dc11-4849-aa2d-b5ff204596b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'servidor.js:139',message:'crearCompraObra VALIDATION FAIL tipo_destino',data:{tipo_destino:datos?.tipo_destino},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            return { success: false, mensaje: 'Debe seleccionar un tipo de destino' }
        }
        
        if (datos.tipo_destino !== 'stock_general' && !datos.destino_id) {
            // #region agent log
            await fetch('http://127.0.0.1:7242/ingest/105a53c3-dc11-4849-aa2d-b5ff204596b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'servidor.js:143',message:'crearCompraObra VALIDATION FAIL destino_id',data:{tipo_destino:datos?.tipo_destino,destino_id:datos?.destino_id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            return { success: false, mensaje: `Debe seleccionar una ${datos.tipo_destino === 'obra' ? 'obra' : 'servicio'}` }
        }
        
        if (!datos.numero_factura || datos.numero_factura.trim() === '') {
            // #region agent log
            await fetch('http://127.0.0.1:7242/ingest/105a53c3-dc11-4849-aa2d-b5ff204596b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'servidor.js:147',message:'crearCompraObra VALIDATION FAIL numero_factura',data:{numero_factura:datos?.numero_factura},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            return { success: false, mensaje: 'El número de factura es obligatorio' }
        }
        
        if (!datos.detalle || datos.detalle.length === 0) {
            // #region agent log
            await fetch('http://127.0.0.1:7242/ingest/105a53c3-dc11-4849-aa2d-b5ff204596b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'servidor.js:151',message:'crearCompraObra VALIDATION FAIL detalle',data:{detalleCount:datos?.detalle?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            return { success: false, mensaje: 'Debe agregar al menos un material' }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()
        
        // #region agent log
        await fetch('http://127.0.0.1:7242/ingest/105a53c3-dc11-4849-aa2d-b5ff204596b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'servidor.js:156',message:'crearCompraObra TRANSACTION STARTED',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,E'})}).catch(()=>{});
        // #endregion

        try {
            // Insertar compra
            // #region agent log
            await fetch('http://127.0.0.1:7242/ingest/105a53c3-dc11-4849-aa2d-b5ff204596b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'servidor.js:159',message:'crearCompraObra BEFORE INSERT',data:{empresaId,proveedor_id:datos.proveedor_id,tipo_destino:datos.tipo_destino,destino_id:datos.destino_id,total:datos.total},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,E'})}).catch(()=>{});
            // #endregion
            const [result] = await connection.query(
                `INSERT INTO compras_obra (
                    empresa_id, tipo_destino, destino_id, orden_trabajo_id,
                    proveedor_id, numero_factura, tipo_comprobante,
                    subtotal, impuesto, total, forma_pago, tipo_compra,
                    estado, fecha_compra, notas, usuario_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    empresaId,
                    datos.tipo_destino,
                    datos.destino_id,
                    datos.orden_trabajo_id || null,
                    datos.proveedor_id,
                    datos.numero_factura,
                    datos.tipo_comprobante || null,
                    datos.subtotal,
                    datos.impuesto || 0,
                    datos.total,
                    datos.forma_pago,
                    datos.tipo_compra || 'planificada',
                    'registrada',
                    datos.fecha_compra || new Date().toISOString().split('T')[0],
                    datos.notas || null,
                    userId
                ]
            )
            
            const compraId = result.insertId
            
            // #region agent log
            await fetch('http://127.0.0.1:7242/ingest/105a53c3-dc11-4849-aa2d-b5ff204596b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'servidor.js:187',message:'crearCompraObra INSERT SUCCESS',data:{compraId,insertId:result?.insertId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,E'})}).catch(()=>{});
            // #endregion
            
            // Insertar detalle
            for (const item of datos.detalle) {
                await connection.query(
                    `INSERT INTO compras_obra_detalle (
                        compra_obra_id, material_nombre, material_descripcion,
                        unidad_medida, cantidad, precio_unitario, subtotal, producto_id, categoria_material_id
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        compraId,
                        item.material_nombre,
                        item.material_descripcion || null,
                        item.unidad_medida || null,
                        item.cantidad,
                        item.precio_unitario,
                        item.subtotal,
                        item.producto_id || null,
                        item.categoria_material_id || null
                    ]
                )
            }

            // Actualizar costo_real de obra o servicio si aplica
            if (datos.tipo_destino === 'obra' && datos.destino_id) {
                await connection.query(
                    `UPDATE obras 
                     SET costo_real = costo_real + ?,
                         fecha_actualizacion = CURRENT_TIMESTAMP
                     WHERE id = ? AND empresa_id = ?`,
                    [datos.total, datos.destino_id, empresaId]
                )
            } else if (datos.tipo_destino === 'servicio' && datos.destino_id) {
                await connection.query(
                    `UPDATE servicios 
                     SET costo_real = costo_real + ?,
                         fecha_actualizacion = CURRENT_TIMESTAMP
                     WHERE id = ? AND empresa_id = ?`,
                    [datos.total, datos.destino_id, empresaId]
                )
            }
            
            await connection.commit()
            connection.release()
            
            // #region agent log
            await fetch('http://127.0.0.1:7242/ingest/105a53c3-dc11-4849-aa2d-b5ff204596b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'servidor.js:229',message:'crearCompraObra COMMIT SUCCESS',data:{compraId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion

            // Subir archivos si existen (después del commit)
            if (datos.archivos && Array.isArray(datos.archivos) && datos.archivos.length > 0) {
                await subirArchivosCompra(compraId, datos.archivos)
            }
            
            return { success: true, mensaje: 'Compra registrada exitosamente', id: compraId }
        } catch (innerError) {
            // #region agent log
            await fetch('http://127.0.0.1:7242/ingest/105a53c3-dc11-4849-aa2d-b5ff204596b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'servidor.js:239',message:'crearCompraObra INNER ERROR',data:{error:innerError?.message,code:innerError?.code,sqlMessage:innerError?.sqlMessage},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,E'})}).catch(()=>{});
            // #endregion
            await connection.rollback()
            throw innerError
        }
    } catch (error) {
        // #region agent log
        await fetch('http://127.0.0.1:7242/ingest/105a53c3-dc11-4849-aa2d-b5ff204596b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'servidor.js:243',message:'crearCompraObra OUTER ERROR',data:{error:error?.message,code:error?.code,stack:error?.stack?.substring(0,300)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,E'})}).catch(()=>{});
        // #endregion
        console.error('Error al crear compra:', error)
        if (connection) {
            await connection.rollback()
            connection.release()
        }
        return { success: false, mensaje: 'Error al registrar compra' }
    }
}

export async function obtenerObrasParaCompra() {
    const res = await obtenerObras({ estado: 'activa' })
    return res
}

// =====================================================
// FUNCIONES PARA MATERIALES Y CATÁLOGO
// =====================================================

/**
 * Buscar materiales en el catálogo para autocompletado
 */
export async function obtenerMaterialesCatalogo(termino = '', empresaId = null) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaIdCookie = empresaId || cookieStore.get('empresaId')?.value

        if (!empresaIdCookie) {
            return { success: false, mensaje: 'Sesión inválida', materiales: [] }
        }

        connection = await db.getConnection()

        let query = `
            SELECT mc.id,
                   mc.nombre,
                   mc.descripcion,
                   mc.unidad_medida_base,
                   mc.categoria_id,
                   mc.codigo,
                   cat.nombre AS categoria_nombre
            FROM materiales_catalogo mc
            LEFT JOIN materiales_categorias cat ON mc.categoria_id = cat.id
            WHERE mc.empresa_id = ? AND mc.es_activo = TRUE
        `
        const params = [empresaIdCookie]

        if (termino && termino.trim().length >= 2) {
            query += ' AND (mc.nombre LIKE ? OR mc.codigo LIKE ? OR mc.descripcion LIKE ?)'
            const terminoLike = `%${termino.trim()}%`
            params.push(terminoLike, terminoLike, terminoLike)
        }

        query += ' ORDER BY mc.nombre ASC LIMIT 20'

        const [materiales] = await connection.query(query, params)
        connection.release()

        return { success: true, materiales }
    } catch (error) {
        console.error('Error al buscar materiales:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al buscar materiales', materiales: [] }
    }
}

/**
 * Obtener materiales recientes (últimos N materiales usados)
 */
export async function obtenerMaterialesRecientes(empresaId = null, limite = 10) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaIdCookie = empresaId || cookieStore.get('empresaId')?.value

        if (!empresaIdCookie) {
            return { success: false, mensaje: 'Sesión inválida', materiales: [] }
        }

        connection = await db.getConnection()

        const [materiales] = await connection.query(
            `SELECT DISTINCT cod.material_nombre,
                    cod.unidad_medida,
                    cod.categoria_material_id,
                    cat.nombre AS categoria_nombre,
                    MAX(co.fecha_compra) AS ultima_compra,
                    COUNT(*) AS veces_usado
             FROM compras_obra_detalle cod
             INNER JOIN compras_obra co ON cod.compra_obra_id = co.id
             LEFT JOIN materiales_categorias cat ON cod.categoria_material_id = cat.id
             WHERE co.empresa_id = ?
             GROUP BY cod.material_nombre, cod.unidad_medida, cod.categoria_material_id
             ORDER BY ultima_compra DESC, veces_usado DESC
             LIMIT ?`,
            [empresaIdCookie, limite]
        )

        connection.release()

        return { success: true, materiales }
    } catch (error) {
        console.error('Error al obtener materiales recientes:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al obtener materiales recientes', materiales: [] }
    }
}

/**
 * Obtener precio sugerido de un material para un proveedor específico
 */
export async function obtenerPrecioMaterial(materialId, proveedorId) {
    let connection
    try {
        if (!materialId || !proveedorId) {
            return { success: false, precio: null }
        }

        connection = await db.getConnection()

        const [precios] = await connection.query(
            `SELECT precio, moneda, fecha_inicio, fecha_fin
             FROM materiales_precios
             WHERE material_id = ? AND proveedor_id = ?
             AND (fecha_fin IS NULL OR fecha_fin >= CURDATE())
             ORDER BY fecha_inicio DESC
             LIMIT 1`,
            [materialId, proveedorId]
        )

        connection.release()

        if (precios.length > 0) {
            return { success: true, precio: precios[0].precio, moneda: precios[0].moneda || 'RD$' }
        }

        return { success: true, precio: null }
    } catch (error) {
        console.error('Error al obtener precio:', error)
        if (connection) connection.release()
        return { success: false, precio: null }
    }
}

/**
 * Obtener servicios activos para compra (similar a obtenerObrasParaCompra)
 */
export async function obtenerServiciosParaCompra() {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida', servicios: [] }
        }

        connection = await db.getConnection()

        const [servicios] = await connection.query(
            `SELECT id, codigo_servicio, nombre, ubicacion, estado
             FROM servicios
             WHERE empresa_id = ? 
             AND estado IN ('pendiente', 'programado', 'en_ejecucion')
             ORDER BY nombre ASC`,
            [empresaId]
        )

        connection.release()

        return { success: true, servicios }
    } catch (error) {
        console.error('Error al obtener servicios:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar servicios', servicios: [] }
    }
}

// =====================================================
// FUNCIONES PARA PLANTILLAS DE COMPRA
// =====================================================

/**
 * Obtener plantillas de compra disponibles
 */
export async function obtenerPlantillasCompra(tipoDestino = null) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida', plantillas: [] }
        }

        connection = await db.getConnection()

        let query = `
            SELECT id, nombre, descripcion, tipo_destino, es_activa
            FROM plantillas_compra_obra
            WHERE empresa_id = ? AND es_activa = TRUE
        `
        const params = [empresaId]

        if (tipoDestino && tipoDestino !== 'stock_general') {
            query += ' AND tipo_destino = ?'
            params.push(tipoDestino)
        }

        query += ' ORDER BY nombre ASC'

        const [plantillas] = await connection.query(query, params)
        connection.release()

        return { success: true, plantillas }
    } catch (error) {
        console.error('Error al obtener plantillas:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar plantillas', plantillas: [] }
    }
}

/**
 * Obtener detalle completo de una plantilla
 */
export async function obtenerPlantillaPorId(plantillaId) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()

        // Obtener plantilla
        const [plantillas] = await connection.query(
            `SELECT id, nombre, descripcion, tipo_destino, es_activa
             FROM plantillas_compra_obra
             WHERE id = ? AND empresa_id = ? AND es_activa = TRUE`,
            [plantillaId, empresaId]
        )

        if (plantillas.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Plantilla no encontrada' }
        }

        // Obtener detalle de materiales
        const [detalle] = await connection.query(
            `SELECT pcd.id,
                    pcd.material_id,
                    pcd.unidad_medida,
                    pcd.cantidad_referencial,
                    pcd.orden,
                    mc.nombre AS material_nombre,
                    mc.descripcion AS material_descripcion,
                    mc.unidad_medida_base,
                    mc.categoria_id,
                    cat.nombre AS categoria_nombre
             FROM plantillas_compra_obra_detalle pcd
             INNER JOIN materiales_catalogo mc ON pcd.material_id = mc.id
             LEFT JOIN materiales_categorias cat ON mc.categoria_id = cat.id
             WHERE pcd.plantilla_id = ?
             ORDER BY pcd.orden ASC, mc.nombre ASC`,
            [plantillaId]
        )

        connection.release()

        return {
            success: true,
            plantilla: {
                ...plantillas[0],
                detalle
            }
        }
    } catch (error) {
        console.error('Error al obtener plantilla:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar plantilla' }
    }
}

// =====================================================
// FUNCIONES PARA ARCHIVOS DE COMPRA
// =====================================================

/**
 * Guardar archivo de compra (factura, conduce, recibo, etc.)
 */
async function guardarArchivoCompra(base64Data, compraId, tipoDocumento, nombreArchivo) {
    try {
        // Validar formato
        if (!base64Data || (!base64Data.startsWith('data:application/') && !base64Data.startsWith('data:image/'))) {
            throw new Error('Formato de archivo inválido')
        }

        // Extraer información
        const matches = base64Data.match(/^data:(application|image)\/(\w+);base64,(.+)$/)
        if (!matches) {
            throw new Error('Base64 inválido')
        }

        const [, , extension, data] = matches
        const buffer = Buffer.from(data, 'base64')

        // Validar extensión permitida
        const extensionesPermitidas = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif', 'webp']
        if (!extensionesPermitidas.includes(extension.toLowerCase())) {
            throw new Error(`Extensión ${extension} no permitida`)
        }

        // Validar tamaño (máximo 10MB)
        const maxSize = 10 * 1024 * 1024
        if (buffer.length > maxSize) {
            throw new Error('El archivo es demasiado grande. Máximo 10MB')
        }

        // Crear directorio si no existe
        const isProduction = process.env.NODE_ENV === 'production'
        const COMPRAS_DOCS_DIR = isProduction
            ? '/var/data/pdv_images/compras'
            : path.join(process.cwd(), 'public', 'images', 'compras')
        
        await fs.mkdir(COMPRAS_DOCS_DIR, { recursive: true })

        // Nombre único
        const timestamp = Date.now()
        const sanitizedNombre = nombreArchivo.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100)
        const fileName = `compra_${compraId}_${tipoDocumento}_${sanitizedNombre}_${timestamp}.${extension}`
        const filePath = path.join(COMPRAS_DOCS_DIR, fileName)

        // Guardar archivo
        await fs.writeFile(filePath, buffer)

        // Retornar información
        return {
            nombre_archivo: fileName,
            url_archivo: `/images/compras/${fileName}`,
            tipo_mime: `${matches[1]}/${extension}`,
            tamano_bytes: buffer.length
        }
    } catch (error) {
        console.error('Error al guardar archivo:', error)
        throw error
    }
}

/**
 * Subir archivos de compra (después de crear la compra)
 */
export async function subirArchivosCompra(compraId, archivos) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        // Verificar que la compra existe y pertenece a la empresa
        connection = await db.getConnection()
        const [compras] = await connection.query(
            'SELECT id FROM compras_obra WHERE id = ? AND empresa_id = ?',
            [compraId, empresaId]
        )

        if (compras.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Compra no encontrada' }
        }

        // Procesar cada archivo
        const archivosGuardados = []
        for (const archivo of archivos) {
            if (!archivo.base64 || !archivo.tipo_documento || !archivo.nombre_archivo) {
                continue
            }

            try {
                const archivoInfo = await guardarArchivoCompra(
                    archivo.base64,
                    compraId,
                    archivo.tipo_documento,
                    archivo.nombre_archivo
                )

                // Guardar en base de datos
                await connection.query(
                    `INSERT INTO compras_obra_archivos (
                        compra_obra_id, nombre_archivo, url_archivo, tipo_mime, tamano_bytes, tipo_documento
                    ) VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        compraId,
                        archivoInfo.nombre_archivo,
                        archivoInfo.url_archivo,
                        archivoInfo.tipo_mime,
                        archivoInfo.tamano_bytes,
                        archivo.tipo_documento
                    ]
                )

                archivosGuardados.push(archivoInfo)
            } catch (error) {
                console.error('Error al guardar archivo individual:', error)
                // Continuar con los demás archivos aunque uno falle
            }
        }

        connection.release()

        return {
            success: true,
            mensaje: `${archivosGuardados.length} archivo(s) subido(s) exitosamente`,
            archivos: archivosGuardados
        }
    } catch (error) {
        console.error('Error al subir archivos:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al subir archivos' }
    }
}

/**
 * Obtener proveedores activos para el formulario
 */
export async function obtenerProveedores() {
    let connection
    try {
        // #region agent log
        const logData = {location:'servidor.js:673',message:'obtenerProveedores ENTRY',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};
        await fetch('http://127.0.0.1:7242/ingest/105a53c3-dc11-4849-aa2d-b5ff204596b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch(()=>{});
        // #endregion
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        // #region agent log
        await fetch('http://127.0.0.1:7242/ingest/105a53c3-dc11-4849-aa2d-b5ff204596b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'servidor.js:679',message:'obtenerProveedores empresaId CHECK',data:{empresaId:empresaId||'MISSING'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida', proveedores: [] }
        }

        connection = await db.getConnection()

        // #region agent log
        await fetch('http://127.0.0.1:7242/ingest/105a53c3-dc11-4849-aa2d-b5ff204596b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'servidor.js:686',message:'obtenerProveedores BEFORE QUERY',data:{empresaId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion

        // Primero verificar si hay proveedores sin filtrar por activo
        const [allProveedores] = await connection.query(
            `SELECT id, nombre_comercial, razon_social, activo, empresa_id
             FROM proveedores
             WHERE empresa_id = ?`,
            [empresaId]
        )
        
        // También verificar si hay proveedores en otras empresas (para debug)
        const [anyProveedores] = await connection.query(
            `SELECT COUNT(*) as total FROM proveedores`
        )
        
        // #region agent log
        await fetch('http://127.0.0.1:7242/ingest/105a53c3-dc11-4849-aa2d-b5ff204596b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'servidor.js:690',message:'obtenerProveedores ALL PROVEEDORES',data:{count:allProveedores?.length,proveedores:allProveedores?.map(p=>({id:p.id,nombre:p.nombre_comercial,activo:p.activo,activoType:typeof p.activo})),totalEnDB:anyProveedores?.[0]?.total,empresaId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion

        const [proveedores] = await connection.query(
            `SELECT 
                id, 
                empresa_id,
                rnc,
                razon_social,
                nombre_comercial,
                actividad_economica,
                contacto,
                telefono,
                email,
                direccion,
                sector,
                municipio,
                provincia,
                sitio_web,
                condiciones_pago,
                activo,
                fecha_creacion
             FROM proveedores
             WHERE empresa_id = ? AND activo = 1
             ORDER BY nombre_comercial ASC, razon_social ASC`,
            [empresaId]
        )

        // #region agent log
        await fetch('http://127.0.0.1:7242/ingest/105a53c3-dc11-4849-aa2d-b5ff204596b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'servidor.js:710',message:'obtenerProveedores QUERY RESULT',data:{count:proveedores?.length,first3:proveedores?.slice(0,3)?.map(p=>({id:p.id,nombre:p.nombre_comercial}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion

        connection.release()

        return { success: true, proveedores }
    } catch (error) {
        // #region agent log
        await fetch('http://127.0.0.1:7242/ingest/105a53c3-dc11-4849-aa2d-b5ff204596b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'servidor.js:717',message:'obtenerProveedores ERROR',data:{error:error?.message,code:error?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,E'})}).catch(()=>{});
        // #endregion
        console.error('Error al obtener proveedores:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar proveedores', proveedores: [] }
    }
}

