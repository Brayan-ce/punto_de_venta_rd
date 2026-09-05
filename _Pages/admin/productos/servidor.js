"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import { eliminarImagenProducto } from '@/services/imageService'

/**
 * Obtiene productos con paginación y búsqueda optimizada
 * 
 * @param {Object} params - Parámetros de paginación y filtros
 * @param {number} params.page - Página actual (default: 1)
 * @param {number} params.limit - Productos por página (default: 50)
 * @param {string} params.search - Búsqueda por nombre/código/SKU
 * @param {number} params.categoriaId - Filtrar por categoría
 * @param {number} params.marcaId - Filtrar por marca
 * @param {string} params.estado - Filtrar por estado (activo/inactivo/bajo_stock)
 */
export async function obtenerProductos(params = {}) {
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

        // Parámetros de paginación
        const page = parseInt(params.page) || 1
        const limit = Math.min(parseInt(params.limit) || 50, 100) // Máximo 100 por página
        const offset = (page - 1) * limit
        const search = params.search?.trim() || ''
        const categoriaId = params.categoriaId ? parseInt(params.categoriaId) : null
        const marcaId = params.marcaId ? parseInt(params.marcaId) : null
        const estado = params.estado || 'todos'

        connection = await db.getConnection()

        // Construir WHERE dinámicamente
        const whereConditions = ['p.empresa_id = ?']
        const queryParams = [empresaId]

        // Búsqueda por texto
        if (search) {
            whereConditions.push(`(
                p.nombre LIKE ? OR 
                p.codigo_barras LIKE ? OR 
                p.sku LIKE ?
            )`)
            const searchPattern = `%${search}%`
            queryParams.push(searchPattern, searchPattern, searchPattern)
        }

        // Filtro por categoría
        if (categoriaId) {
            whereConditions.push('p.categoria_id = ?')
            queryParams.push(categoriaId)
        }

        // Filtro por marca
        if (marcaId) {
            whereConditions.push('p.marca_id = ?')
            queryParams.push(marcaId)
        }

        // Filtro por estado
        if (estado === 'activo') {
            whereConditions.push('p.activo = TRUE')
        } else if (estado === 'inactivo') {
            whereConditions.push('p.activo = FALSE')
        } else if (estado === 'bajo_stock') {
            whereConditions.push('p.stock <= p.stock_minimo')
        }

        const whereClause = whereConditions.join(' AND ')

        // Query optimizada: solo campos necesarios para listado
        // Para vendedores, excluir precio_compra y stock numérico desde SQL
        const camposProducto = userTipo === 'admin' 
            ? `p.id,
                p.codigo_barras,
                p.sku,
                p.nombre,
                p.descripcion,
                p.categoria_id,
                p.marca_id,
                p.precio_compra,
                p.precio_venta,
                p.precio_oferta,
                p.stock,
                p.stock_minimo,
                p.stock_maximo,
                p.imagen_url,
                p.activo,
                um.abreviatura as unidad_medida_abreviatura`
            : `p.id,
                p.codigo_barras,
                p.sku,
                p.nombre,
                p.descripcion,
                p.categoria_id,
                p.marca_id,
                p.precio_venta,
                p.precio_oferta,
                p.stock,
                p.stock_minimo,
                p.imagen_url,
                p.activo,
                um.abreviatura as unidad_medida_abreviatura`

        const [productos] = await connection.execute(
            `SELECT 
                ${camposProducto},
                c.nombre as categoria_nombre,
                m.nombre as marca_nombre
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            LEFT JOIN marcas m ON p.marca_id = m.id
            LEFT JOIN unidades_medida um ON p.unidad_medida_id = um.id
            WHERE ${whereClause}
            ORDER BY p.nombre ASC
            LIMIT ? OFFSET ?`,
            [...queryParams, limit, offset]
        )

        // Contar total (para paginación)
        const [countResult] = await connection.execute(
            `SELECT COUNT(*) as total
            FROM productos p
            WHERE ${whereClause}`,
            queryParams
        )

        const total = countResult[0]?.total || 0
        const totalPages = Math.ceil(total / limit)

        connection.release()

        // Procesar productos según rol
        let productosProcesados = productos
        
        if (userTipo === 'vendedor') {
            productosProcesados = productos.map(producto => {
                let estadoStock = 'disponible'
                if (producto.stock <= 0) {
                    estadoStock = 'agotado'
                } else if (producto.stock <= producto.stock_minimo || producto.stock <= 5) {
                    estadoStock = 'bajo'
                }
                
                return {
                    id: producto.id,
                    codigo_barras: producto.codigo_barras,
                    sku: producto.sku,
                    nombre: producto.nombre,
                    descripcion: producto.descripcion,
                    categoria_id: producto.categoria_id,
                    marca_id: producto.marca_id,
                    precio_venta: producto.precio_venta,
                    precio_oferta: producto.precio_oferta,
                    estado_stock: estadoStock,
                    imagen_url: producto.imagen_url,
                    activo: producto.activo,
                    categoria_nombre: producto.categoria_nombre,
                    marca_nombre: producto.marca_nombre,
                    unidad_medida_abreviatura: producto.unidad_medida_abreviatura
                }
            })
        }

        return {
            success: true,
            productos: productosProcesados,
            paginacion: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            },
            userTipo
        }

    } catch (error) {
        console.error('Error al obtener productos:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar productos'
        }
    }
}

/**
 * Obtiene categorías y marcas (cacheable, se carga una vez)
 */
export async function obtenerFiltros() {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [categorias] = await connection.execute(
            `SELECT id, nombre
            FROM categorias
            WHERE empresa_id = ? AND activo = TRUE
            ORDER BY nombre ASC`,
            [empresaId]
        )

        const [marcas] = await connection.execute(
            `SELECT id, nombre
            FROM marcas
            WHERE empresa_id = ? AND activo = TRUE
            ORDER BY nombre ASC`,
            [empresaId]
        )

        connection.release()

        return {
            success: true,
            categorias,
            marcas
        }

    } catch (error) {
        console.error('Error al obtener filtros:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar filtros'
        }
    }
}

/**
 * Obtiene estadísticas de productos (sin traer todos los productos)
 */
export async function obtenerEstadisticas() {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        // Estadísticas calculadas en SQL (muy rápido)
        const [stats] = await connection.execute(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN activo = TRUE THEN 1 ELSE 0 END) as activos,
                SUM(CASE WHEN stock <= stock_minimo THEN 1 ELSE 0 END) as bajo_stock,
                SUM(COALESCE(precio_venta, 0) * stock) as valor_inventario,
                SUM(COALESCE(precio_compra, 0) * stock) as costo_inventario
            FROM productos
            WHERE empresa_id = ?`,
            [empresaId]
        )

        connection.release()

        const total = stats[0]?.total || 0
        const valorInventario = parseFloat(stats[0]?.valor_inventario || 0)
        const costoInventario = parseFloat(stats[0]?.costo_inventario || 0)
        const gananciaProyectada = valorInventario - costoInventario
        const margenProyectado = valorInventario > 0 ? (gananciaProyectada / valorInventario) * 100 : 0

        return {
            success: true,
            estadisticas: {
                total,
                activos: stats[0]?.activos || 0,
                bajoStock: stats[0]?.bajo_stock || 0,
                valorInventario,
                costoInventario,
                gananciaProyectada,
                margenProyectado: parseFloat(margenProyectado.toFixed(2))
            }
        }

    } catch (error) {
        console.error('Error al obtener estadísticas:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar estadísticas'
        }
    }
}

export async function eliminarProducto(productoId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para eliminar productos'
            }
        }

        connection = await db.getConnection()

        // Obtener datos del producto antes de eliminar
        const [producto] = await connection.execute(
            `SELECT id, nombre, imagen_url, empresa_id FROM productos WHERE id = ? AND empresa_id = ?`,
            [productoId, empresaId]
        )

        if (producto.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Producto no encontrado'
            }
        }

        // Verificar si el producto tiene VENTAS (historial importante)
        const [ventasResultado] = await connection.execute(
            `SELECT COUNT(*) as count FROM detalle_ventas WHERE producto_id = ?`,
            [productoId]
        )
        const tieneVentas = ventasResultado[0].count > 0

        // Verificar si el producto tiene COMPRAS (historial importante)
        const [comprasResultado] = await connection.execute(
            `SELECT COUNT(*) as count FROM detalle_compras WHERE producto_id = ?`,
            [productoId]
        )
        const tieneCompras = comprasResultado[0].count > 0

        // Si tiene ventas o compras, archivar antes de eliminar
        if (tieneVentas || tieneCompras) {
            // Archivar el producto
            await connection.execute(
                `INSERT INTO productos_archivados (
                    id, empresa_id, codigo_barras, sku, nombre, descripcion,
                    categoria_id, marca_id, unidad_medida_id,
                    precio_compra, precio_venta, precio_oferta, precio_mayorista,
                    cantidad_mayorista, stock, stock_minimo, stock_maximo,
                    imagen_url, aplica_itbis, activo,
                    fecha_vencimiento, lote, ubicacion_bodega,
                    es_rastreable, tipo_activo, requiere_serie,
                    permite_financiamiento, meses_max_financiamiento,
                    meses_garantia, tasa_depreciacion, precio_por_unidad,
                    permite_decimales, unidad_venta_default_id,
                    fecha_eliminacion, eliminado_por, razon_eliminacion,
                    total_ventas, total_compras
                )
                SELECT 
                    p.id, p.empresa_id, p.codigo_barras, p.sku, p.nombre, p.descripcion,
                    p.categoria_id, p.marca_id, p.unidad_medida_id,
                    p.precio_compra, p.precio_venta, p.precio_oferta, p.precio_mayorista,
                    p.cantidad_mayorista, p.stock, p.stock_minimo, p.stock_maximo,
                    p.imagen_url, p.aplica_itbis, 0,
                    p.fecha_vencimiento, p.lote, p.ubicacion_bodega,
                    p.es_rastreable, p.tipo_activo, p.requiere_serie,
                    p.permite_financiamiento, p.meses_max_financiamiento,
                    p.meses_garantia, p.tasa_depreciacion, p.precio_por_unidad,
                    p.permite_decimales, p.unidad_venta_default_id,
                    NOW(), ?, ?,
                    (SELECT COUNT(*) FROM detalle_ventas WHERE producto_id = p.id),
                    (SELECT COUNT(*) FROM detalle_compras WHERE producto_id = p.id)
                FROM productos p
                WHERE p.id = ?`,
                [userId, `Producto eliminado con ${ventasResultado[0].count} ventas y ${comprasResultado[0].count} compras en historial`, productoId]
            )

            // El producto ya está archivado, ahora eliminar de tablas NO esenciales
            // Las tablas de ventas/compras/movimientos se mantienen (preservan el producto_id)
            // porque ahora el producto existe en productos_archivados con el MISMO ID
            
            // Eliminar de tablas de operación actual (no históricas)
            await connection.execute(`DELETE FROM stock_sucursal WHERE producto_id = ?`, [productoId])
            await connection.execute(`DELETE FROM alertas_cantidad_producto WHERE producto_id = ?`, [productoId])
            await connection.execute(`DELETE FROM productos_catalogo WHERE producto_id = ?`, [productoId])
            await connection.execute(`DELETE FROM transferencias_stock_detalle WHERE producto_id = ?`, [productoId])
            await connection.execute(`DELETE FROM movimientos_stock_sucursal WHERE producto_id = ?`, [productoId])
            await connection.execute(`DELETE FROM presupuesto_tareas WHERE producto_id = ?`, [productoId])
            await connection.execute(`DELETE FROM servicios_recursos WHERE producto_id = ?`, [productoId])
            await connection.execute(`DELETE FROM compras_obra_detalle WHERE producto_id = ?`, [productoId])
            await connection.execute(`DELETE FROM saldo_despacho WHERE producto_id = ?`, [productoId])
            await connection.execute(`DELETE FROM historial_unidades_venta WHERE producto_id = ?`, [productoId])
            await connection.execute(`DELETE FROM pedidos_online_items WHERE producto_id = ?`, [productoId])
            await connection.execute(`DELETE FROM cotizacion_detalle WHERE producto_id = ?`, [productoId])
            await connection.execute(`DELETE FROM conduce_detalle WHERE producto_id = ?`, [productoId])
        }

        // Ahora eliminar el producto principal
        // Esto funcionará porque las tablas históricas pueden tener FK a productos_archivados
        // o simplemente mantienen el ID como referencia sin FK estricto
        const [resultadoDelete] = await connection.execute(
            `DELETE FROM productos WHERE id = ? AND empresa_id = ?`,
            [productoId, empresaId]
        )

        if (!resultadoDelete?.affectedRows) {
            connection.release()
            return {
                success: false,
                mensaje: 'No se pudo eliminar el producto'
            }
        }

        connection.release()

        // Eliminar imagen física si es local
        const imagenUrl = producto[0].imagen_url
        if (imagenUrl && imagenUrl.startsWith('/images/productos/')) {
            await eliminarImagenProducto(imagenUrl)
        }

        // Mensaje diferente según si se archivó o no
        const mensaje = tieneVentas || tieneCompras
            ? `Producto "${producto[0].nombre}" eliminado y archivado en historial (${ventasResultado[0].count} ventas, ${comprasResultado[0].count} compras preservadas)`
            : `Producto "${producto[0].nombre}" eliminado permanentemente`

        return {
            success: true,
            mensaje: mensaje,
            archivado: tieneVentas || tieneCompras,
            ventasPreservadas: ventasResultado[0].count,
            comprasPreservadas: comprasResultado[0].count
        }

    } catch (error) {
        console.error('Error al eliminar producto:', error)
        
        if (connection) {
            connection.release()
        }

        // Si es error de foreign key, intentar desactivar como fallback
        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
            return {
                success: false,
                mensaje: 'No se pudo eliminar automáticamente. El producto tiene dependencias complejas. Use la opción de desactivar.',
                sugerencia: 'desactivar'
            }
        }

        return {
            success: false,
            mensaje: 'Error al eliminar producto: ' + error.message
        }
    }
}

export async function eliminarProductos(ids) {
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || userTipo !== 'admin') {
            return { success: false, mensaje: 'No tienes permisos para eliminar productos' }
        }

        const idList = Array.isArray(ids) ? ids.filter((id) => id !== null && id !== undefined) : []
        if (idList.length === 0) {
            return { success: true, mensaje: 'No se seleccionaron productos', eliminados: 0 }
        }

        let eliminados = 0
        let archivados = 0
        for (const id of idList) {
            const res = await eliminarProducto(Number(id))
            if (res && res.success) {
                eliminados++
                if (res.archivado) archivados++
            }
        }

        return {
            success: true,
            mensaje: `${eliminados} producto(s) eliminado(s)` + (archivados > 0 ? ` (${archivados} archivados con historial)` : ''),
            eliminados,
            archivados
        }
    } catch (error) {
        console.error('Error al eliminar productos:', error)
        return { success: false, mensaje: 'Error al eliminar los productos' }
    }
}

export async function eliminarTodosProductos() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || userTipo !== 'admin') {
            return { success: false, mensaje: 'No tienes permisos' }
        }

        connection = await db.getConnection()
        const [ids] = await connection.execute(
            `SELECT id FROM productos WHERE empresa_id = ?`,
            [empresaId]
        )
        connection.release()

        const idList = ids.map((r) => r.id)
        if (idList.length === 0) {
            return { success: true, mensaje: 'No hay productos para eliminar', eliminados: 0 }
        }
        return eliminarProductos(idList)
    } catch (error) {
        console.error('Error al eliminar todos los productos:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al eliminar los productos' }
    }
}

export async function obtenerDatosEmpresa() {
  let connection
  try {
    const cookieStore = await cookies()
    const empresaId = cookieStore.get('empresaId')?.value

    if (!empresaId) {
      return { success: false, mensaje: 'Sesion invalida' }
    }

    connection = await db.getConnection()

    const [rows] = await connection.execute(
      `SELECT moneda, simbolo_moneda, locale, impuesto_nombre, impuesto_porcentaje
       FROM empresas
       WHERE id = ? AND activo = TRUE`,
      [empresaId]
    )

    connection.release()

    if (rows.length === 0) {
      return { success: false, mensaje: 'Empresa no encontrada' }
    }

    return {
      success: true,
      empresa: rows[0]
    }
  } catch (error) {
    console.error('Error al obtener datos empresa:', error)
    if (connection) connection.release()
    return { success: false, mensaje: 'Error al obtener datos empresa' }
  }
}