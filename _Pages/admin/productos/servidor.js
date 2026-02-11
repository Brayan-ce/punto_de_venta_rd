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
                SUM(precio_venta * stock) as valor_inventario
            FROM productos
            WHERE empresa_id = ?`,
            [empresaId]
        )

        connection.release()

        return {
            success: true,
            estadisticas: {
                total: stats[0]?.total || 0,
                activos: stats[0]?.activos || 0,
                bajoStock: stats[0]?.bajo_stock || 0,
                valorInventario: parseFloat(stats[0]?.valor_inventario || 0)
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

        // Obtener imagen antes de eliminar producto
        const [producto] = await connection.execute(
            `SELECT id, imagen_url FROM productos WHERE id = ? AND empresa_id = ?`,
            [productoId, empresaId]
        )

        if (producto.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Producto no encontrado'
            }
        }

        // Soft delete del producto
        await connection.execute(
            `UPDATE productos SET activo = FALSE WHERE id = ? AND empresa_id = ?`,
            [productoId, empresaId]
        )

        connection.release()

        // Eliminar imagen física si es local
        const imagenUrl = producto[0].imagen_url
        if (imagenUrl && imagenUrl.startsWith('/images/productos/')) {
            await eliminarImagenProducto(imagenUrl)
        }

        return {
            success: true,
            mensaje: 'Producto eliminado exitosamente'
        }

    } catch (error) {
        console.error('Error al eliminar producto:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al eliminar producto'
        }
    }
}