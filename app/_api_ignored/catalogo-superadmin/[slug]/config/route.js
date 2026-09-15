import { NextResponse } from 'next/server'
import db from "@/_DB/db"

/**
 * GET /api/catalogo-superadmin/[slug]/config
 * Obtener configuración pública del catálogo del superadministrador
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

        let configs = []
        try {
            [configs] = await connection.execute(
                `SELECT 
                    cc.id,
                    cc.nombre_catalogo,
                    cc.descripcion,
                    cc.logo_url,
                    cc.color_primario,
                    cc.color_secundario,
                    cc.activo,
                    cc.url_slug,
                    cc.whatsapp,
                    cc.direccion,
                    cc.horario
                FROM catalogo_superadmin_config cc
                WHERE cc.url_slug = ? AND cc.activo = TRUE
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

        connection.release()

        if (configs.length === 0) {
            return NextResponse.json(
                { success: false, mensaje: 'Catálogo no encontrado o inactivo. Verifica que el catálogo esté activo en la configuración.' },
                { status: 404 }
            )
        }

        const config = configs[0]

        // Obtener WhatsApp del superadmin desde plataforma_config si no está configurado
        let whatsappFinal = config.whatsapp
        if (!whatsappFinal) {
            const [plataforma] = await connection.execute(
                `SELECT telefono_whatsapp FROM plataforma_config LIMIT 1`
            )
            if (plataforma.length > 0 && plataforma[0].telefono_whatsapp) {
                whatsappFinal = plataforma[0].telefono_whatsapp
            }
        }

        return NextResponse.json({
            success: true,
            config: {
                id: config.id,
                nombre_catalogo: config.nombre_catalogo,
                descripcion: config.descripcion,
                logo_url: config.logo_url,
                color_primario: config.color_primario,
                color_secundario: config.color_secundario,
                url_slug: config.url_slug,
                whatsapp: whatsappFinal,
                direccion: config.direccion,
                horario: config.horario
            }
        })

    } catch (error) {
        console.error('Error al obtener config catálogo superadmin:', error)
        
        if (connection) {
            connection.release()
        }

        return NextResponse.json(
            { success: false, mensaje: 'Error al cargar configuración del catálogo' },
            { status: 500 }
        )
    }
}

