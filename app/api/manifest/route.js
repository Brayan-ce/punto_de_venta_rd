import db from "@/_DB/db"

export const dynamic = 'force-dynamic'

export async function GET() {
    let connection
    try {
        connection = await db.getConnection()
        const [config] = await connection.execute(
            `SELECT nombre_plataforma FROM plataforma_config LIMIT 1`
        )
        connection.release()

        const nombre = config[0]?.nombre_plataforma || 'IsiWeek'

        const manifest = {
            name: nombre,
            short_name: nombre.length > 12 ? nombre.substring(0, 12) + '...' : nombre,
            description: `${nombre} - Sistema POS completo`,
            lang: 'es-DO',
            start_url: '/?source=pwa',
            scope: '/',
            display: 'standalone',
            display_override: ['fullscreen', 'standalone', 'minimal-ui'],
            background_color: '#ffffff',
            theme_color: '#3B82F6',
            orientation: 'portrait-primary',
            icons: [
                { src: '/logo.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
                { src: '/logo.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
            ],
            shortcuts: [
                {
                    name: 'Nueva Venta', short_name: 'Venta',
                    description: 'Crear nueva venta', url: '/admin/ventas/nuevo',
                    icons: [{ src: '/logo.png', sizes: '192x192', type: 'image/png' }]
                },
                {
                    name: 'Inventario', short_name: 'Inventario',
                    description: 'Ver inventario', url: '/admin/inventario',
                    icons: [{ src: '/logo.png', sizes: '192x192', type: 'image/png' }]
                }
            ],
            categories: ['business', 'productivity'],
            prefer_related_applications: false
        }

        return new Response(JSON.stringify(manifest), {
            headers: {
                'Content-Type': 'application/manifest+json',
                'Cache-Control': 'no-cache'
            }
        })
    } catch (error) {
        console.error('Error al generar manifest:', error)
        if (connection) connection.release()

        const fallback = {
            name: 'IsiWeek',
            short_name: 'IsiWeek',
            description: 'Sistema POS completo',
            start_url: '/',
            display: 'standalone',
            background_color: '#ffffff',
            theme_color: '#3B82F6',
            icons: [
                { src: '/logo.png', sizes: '192x192', type: 'image/png' },
                { src: '/logo.png', sizes: '512x512', type: 'image/png' }
            ]
        }

        return new Response(JSON.stringify(fallback), {
            headers: { 'Content-Type': 'application/manifest+json' }
        })
    }
}
