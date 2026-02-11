import { NextResponse } from 'next/server'
import db from "@/_DB/db"

/**
 * GET /api/catalogo-superadmin/[slug]/productos
 * Obtener productos públicos del catálogo del superadministrador
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
        let configs = []
        try {
            [configs] = await connection.execute(
                `SELECT id FROM catalogo_superadmin_config 
                WHERE url_slug = ? AND activo = TRUE
                LIMIT 1`,
                [slug]
            )
        } catch (tableError) {
            connection.release()
            if (tableError.code === 'ER_NO_SUCH_TABLE') {
                return NextResponse.json(
                    { success: false, mensaje: 'Las tablas del catálogo no existen. Por favor ejecuta la migración SQL primero.' },
                    { status: 500 }
                )
            }
            throw tableError
        }

        if (configs.length === 0) {
            connection.release()
            return NextResponse.json(
                { success: false, mensaje: 'Catálogo no encontrado o inactivo. Verifica que el catálogo esté activo en la configuración.' },
                { status: 404 }
            )
        }

        // Construir query con filtros
        let query = `
            SELECT 
                p.id,
                p.nombre,
                p.descripcion,
                p.imagen_url,
                p.precio_venta,
                p.precio_venta as precio,
                p.precio_oferta,
                p.destacado,
                p.stock,
                p.visible_catalogo,
                p.activo,
                p.sku,
                c.nombre as categoria_nombre,
                c.id as categoria_id
            FROM superadmin_productos_catalogo p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.activo = TRUE AND p.visible_catalogo = TRUE
        `
        const paramsQuery = []

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
            /SELECT[\s\S]*?FROM superadmin_productos_catalogo p/,
            'SELECT COUNT(*) as total FROM superadmin_productos_catalogo p'
        )

        const [countResult] = await connection.execute(countQuery, paramsQuery)
        const total = countResult[0].total

        // Ordenar y paginar
        query += ` ORDER BY p.destacado DESC, p.nombre ASC LIMIT ? OFFSET ?`
        paramsQuery.push(limite, offset)

        const [productos] = await connection.execute(query, paramsQuery)

        // Obtener categorías disponibles
        const [categorias] = await connection.execute(
            `SELECT DISTINCT
                c.id,
                c.nombre
            FROM categorias c
            INNER JOIN superadmin_productos_catalogo p ON c.id = p.categoria_id
            WHERE p.activo = TRUE
            ORDER BY c.nombre ASC`
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
        console.error('Error al obtener productos catálogo superadmin:', error)
        
        if (connection) {
            connection.release()
        }

        return NextResponse.json(
            { success: false, mensaje: 'Error al cargar productos del catálogo' },
            { status: 500 }
        )
    }
}

