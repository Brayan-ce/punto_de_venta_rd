import { NextResponse } from 'next/server'
import db from "@/_DB/db"

/**
 * GET /api/catalogo-superadmin/[slug]/producto/[id]
 * Obtener detalle público de un producto del catálogo del superadmin
 */
export async function GET(request, { params }) {
    let connection
    try {
        const { slug, id } = await params

        if (!slug || !id) {
            return NextResponse.json(
                { success: false, mensaje: 'Slug e ID requeridos' },
                { status: 400 }
            )
        }

        connection = await db.getConnection()

        // Verificar que el catálogo existe y está activo
        const [configs] = await connection.execute(
            `SELECT id FROM catalogo_superadmin_config 
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

        // Obtener producto
        const [productos] = await connection.execute(
            `SELECT 
                p.id,
                p.nombre,
                p.descripcion,
                p.descripcion_corta,
                p.imagen_url,
                p.precio,
                p.precio_oferta,
                p.destacado,
                p.stock,
                p.stock_minimo,
                p.stock_visible,
                p.sku,
                c.nombre as categoria_nombre,
                c.id as categoria_id
            FROM superadmin_productos_catalogo p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.id = ? AND p.activo = TRUE
            LIMIT 1`,
            [parseInt(id)]
        )

        connection.release()

        if (productos.length === 0) {
            return NextResponse.json(
                { success: false, mensaje: 'Producto no encontrado o no disponible' },
                { status: 404 }
            )
        }

        const producto = productos[0]

        return NextResponse.json({
            success: true,
            producto: producto
        })

    } catch (error) {
        console.error('Error al obtener producto catálogo superadmin:', error)
        
        if (connection) {
            connection.release()
        }

        return NextResponse.json(
            { success: false, mensaje: 'Error al cargar producto' },
            { status: 500 }
        )
    }
}

