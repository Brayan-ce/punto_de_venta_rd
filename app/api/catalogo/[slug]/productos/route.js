import { NextResponse } from 'next/server'
import db from "@/_DB/db"

/**
 * GET /api/catalogo/[slug]/productos
 * Obtener productos públicos del catálogo con filtros
 */
export async function GET(request, { params }) {
    let connection
    try {
        const { slug } = await params
        const { searchParams } = new URL(request.url)
        
        const categoria = searchParams.get('categoria') || null
        const busqueda = searchParams.get('busqueda') || null
        const pagina = parseInt(searchParams.get('pagina') || '1')
        const limite = parseInt(searchParams.get('limite') || '20')
        const offset = (pagina - 1) * limite

        if (!slug) {
            return NextResponse.json(
                { success: false, mensaje: 'Slug requerido' },
                { status: 400 }
            )
        }

        connection = await db.getConnection()

        // Verificar que el catálogo existe y está activo
        const [configs] = await connection.execute(
            `SELECT empresa_id FROM catalogo_config 
            WHERE url_slug = ? AND activo = TRUE
            LIMIT 1`,
            [slug]
        )

        if (configs.length === 0) {
            connection.release()
            return NextResponse.json(
                { success: false, mensaje: 'Catálogo no encontrado o inactivo' },
                { status: 404 }
            )
        }

        const empresaId = configs[0].empresa_id

        // Construir query con filtros
        let query = `
            SELECT 
                p.id,
                p.nombre,
                p.descripcion,
                p.imagen_url,
                COALESCE(pc.precio_catalogo, p.precio_venta) as precio,
                p.precio_venta,
                COALESCE(pc.precio_oferta, p.precio_oferta) as precio_oferta,
                pc.destacado,
                pc.descripcion_corta,
                c.nombre as categoria_nombre,
                c.id as categoria_id,
                CASE 
                    WHEN pc.stock_visible = TRUE THEN p.stock
                    ELSE NULL
                END as stock,
                p.stock_minimo,
                p.activo,
                p.sku
            FROM productos p
            INNER JOIN productos_catalogo pc ON p.id = pc.producto_id AND pc.empresa_id = ?
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE pc.visible_catalogo = TRUE 
            AND pc.activo = TRUE
            AND p.activo = TRUE
            AND p.empresa_id = ?
        `
        const paramsQuery = [empresaId, empresaId]

        // Filtro por categoría
        if (categoria) {
            query += ` AND p.categoria_id = ?`
            paramsQuery.push(parseInt(categoria))
        }

        // Filtro por búsqueda
        if (busqueda) {
            query += ` AND (p.nombre LIKE ? OR p.descripcion LIKE ? OR p.sku LIKE ?)`
            const busquedaLike = `%${busqueda}%`
            paramsQuery.push(busquedaLike, busquedaLike, busquedaLike)
        }

        // Contar total
        const countQuery = query.replace(
            'SELECT p.id, p.nombre, p.descripcion, p.imagen_url, COALESCE(pc.precio_catalogo, p.precio_venta) as precio, p.precio_venta, COALESCE(pc.precio_oferta, p.precio_oferta) as precio_oferta, pc.destacado, pc.descripcion_corta, c.nombre as categoria_nombre, c.id as categoria_id, CASE WHEN pc.stock_visible = TRUE THEN p.stock ELSE NULL END as stock, p.stock_minimo, p.activo, p.sku',
            'SELECT COUNT(*) as total'
        )

        const [countResult] = await connection.execute(countQuery, paramsQuery)
        const total = countResult[0].total

        // Ordenar y paginar
        query += ` ORDER BY pc.destacado DESC, pc.orden_visual ASC, p.nombre ASC LIMIT ? OFFSET ?`
        paramsQuery.push(limite, offset)

        const [productos] = await connection.execute(query, paramsQuery)

        // Obtener categorías disponibles
        const [categorias] = await connection.execute(
            `SELECT DISTINCT
                c.id,
                c.nombre
            FROM categorias c
            INNER JOIN productos p ON c.id = p.categoria_id
            INNER JOIN productos_catalogo pc ON p.id = pc.producto_id AND pc.empresa_id = ?
            WHERE pc.visible_catalogo = TRUE 
            AND pc.activo = TRUE
            AND p.activo = TRUE
            AND p.empresa_id = ?
            ORDER BY c.nombre ASC`,
            [empresaId, empresaId]
        )

        connection.release()

        const totalPaginas = Math.ceil(total / limite)

        return NextResponse.json({
            success: true,
            productos: productos,
            categorias: categorias,
            paginacion: {
                pagina: pagina,
                limite: limite,
                total: total,
                total_paginas: totalPaginas,
                tiene_siguiente: pagina < totalPaginas,
                tiene_anterior: pagina > 1
            }
        })

    } catch (error) {
        console.error('Error al obtener productos catálogo:', error)
        
        if (connection) {
            connection.release()
        }

        return NextResponse.json(
            { success: false, mensaje: 'Error al cargar productos del catálogo' },
            { status: 500 }
        )
    }
}

