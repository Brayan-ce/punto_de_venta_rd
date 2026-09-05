import { NextResponse } from 'next/server'
import db from "@/_DB/db"

/**
 * GET /api/catalogo/[slug]/config
 * Obtener configuración pública del catálogo
 */
export async function GET(request, { params }) {
    let connection
    try {
        const { slug } = await params

        if (!slug) {
            return NextResponse.json(
                { success: false, mensaje: 'Slug requerido' },
                { status: 400 }
            )
        }

        connection = await db.getConnection()

        const [configs] = await connection.execute(
            `SELECT 
                cc.id,
                cc.empresa_id,
                cc.nombre_catalogo,
                cc.descripcion,
                cc.logo_url,
                cc.color_primario,
                cc.color_secundario,
                cc.activo,
                cc.url_slug,
                cc.whatsapp,
                cc.direccion,
                cc.horario,
                e.nombre_empresa,
                e.nombre_comercial,
                e.telefono as empresa_telefono,
                e.email as empresa_email,
                e.logo_url as empresa_logo_url,
                e.direccion as empresa_direccion,
                e.sector as empresa_sector,
                e.municipio as empresa_municipio,
                e.provincia as empresa_provincia
            FROM catalogo_config cc
            LEFT JOIN empresas e ON cc.empresa_id = e.id
            WHERE cc.url_slug = ? AND cc.activo = TRUE AND e.activo = TRUE
            LIMIT 1`,
            [slug]
        )

        connection.release()

        if (configs.length === 0) {
            return NextResponse.json(
                { success: false, mensaje: 'Catálogo no encontrado o inactivo' },
                { status: 404 }
            )
        }

        const config = configs[0]

        return NextResponse.json({
            success: true,
            config: {
                id: config.id,
                nombre_catalogo: config.nombre_catalogo,
                descripcion: config.descripcion,
                logo_url: config.logo_url || config.empresa_logo_url,
                color_primario: config.color_primario,
                color_secundario: config.color_secundario,
                url_slug: config.url_slug,
                whatsapp: config.whatsapp,
                direccion: config.direccion || config.empresa_direccion,
                horario: config.horario,
                empresa: {
                    nombre: config.nombre_empresa,
                    nombre_comercial: config.nombre_comercial || config.nombre_empresa,
                    telefono: config.empresa_telefono,
                    email: config.empresa_email,
                    logo_url: config.empresa_logo_url,
                    direccion: config.empresa_direccion,
                    sector: config.empresa_sector,
                    municipio: config.empresa_municipio,
                    provincia: config.empresa_provincia
                }
            }
        })

    } catch (error) {
        console.error('Error al obtener config catálogo:', error)
        
        if (connection) {
            connection.release()
        }

        return NextResponse.json(
            { success: false, mensaje: 'Error al cargar configuración del catálogo' },
            { status: 500 }
        )
    }
}

