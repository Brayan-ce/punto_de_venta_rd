import { NextResponse } from 'next/server'
import db from "@/_DB/db"

/**
 * GET /api/catalogo/[slug]/producto/[id]
 * Obtener detalle público de un producto
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

        // Obtener producto
        const [productos] = await connection.execute(
            `SELECT 
                p.id,
                p.nombre,
                p.descripcion,
                p.imagen_url,
                COALESCE(pc.precio_catalogo, p.precio_venta) as precio,
                COALESCE(pc.precio_oferta, p.precio_oferta) as precio_oferta,
                pc.destacado,
                pc.descripcion_corta,
                c.nombre as categoria_nombre,
                c.id as categoria_id,
                CASE 
                    WHEN pc.stock_visible = TRUE THEN p.stock
                    ELSE NULL
                END as stock,
                p.sku,
                m.nombre as marca_nombre,
                um.abreviatura as unidad_medida_abreviatura,
                p.aplica_itbis
            FROM productos p
            INNER JOIN productos_catalogo pc ON p.id = pc.producto_id AND pc.empresa_id = ?
            LEFT JOIN categorias c ON p.categoria_id = c.id
            LEFT JOIN marcas m ON p.marca_id = m.id
            LEFT JOIN unidades_medida um ON p.unidad_medida_id = um.id
            WHERE p.id = ?
            AND pc.visible_catalogo = TRUE 
            AND pc.activo = TRUE
            AND p.activo = TRUE
            AND p.empresa_id = ?
            LIMIT 1`,
            [empresaId, parseInt(id), empresaId]
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
        console.error('Error al obtener producto catálogo:', error)
        
        if (connection) {
            connection.release()
        }

        return NextResponse.json(
            { success: false, mensaje: 'Error al cargar producto' },
            { status: 500 }
        )
    }
}

