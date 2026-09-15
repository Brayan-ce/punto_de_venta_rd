import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/_DB/db';

/**
 * GET /api/ventas/[id]
 * Obtener datos completos de una venta para impresión
 */
export async function GET(request, { params }) {
    const connection = await db.getConnection();

    try {
        const cookieStore = cookies();
        const userId = cookieStore.get('userId')?.value;
        const empresaId = cookieStore.get('empresaId')?.value;
        const userTipo = cookieStore.get('userTipo')?.value;

        if (!userId) {
            return NextResponse.json(
                { error: 'No autenticado' },
                { status: 401 }
            );
        }

        const ventaId = params.id;

        // Validar que la venta pertenece a la empresa del usuario
        // (excepto superadmin que puede ver todas)
        let whereClause = 'WHERE v.id = ?';
        let queryParams = [ventaId];

        if (userTipo !== 'superadmin') {
            whereClause += ' AND v.empresa_id = ?';
            queryParams.push(empresaId);
        }

        // === OBTENER VENTA CON DATOS RELACIONADOS ===
        const [ventas] = await connection.execute(
            `SELECT 
                v.*,
                c.nombre as cliente_nombre,
                c.rnc as cliente_rnc,
                c.cedula as cliente_cedula,
                c.direccion as cliente_direccion,
                c.telefono as cliente_telefono,
                u.nombre as vendedor_nombre
            FROM ventas v
            LEFT JOIN clientes c ON v.cliente_id = c.id
            LEFT JOIN usuarios u ON v.usuario_id = u.id
            ${whereClause}`,
            queryParams
        );

        if (ventas.length === 0) {
            return NextResponse.json(
                { error: 'Venta no encontrada' },
                { status: 404 }
            );
        }

        const venta = ventas[0];

        // === OBTENER DETALLES DE PRODUCTOS ===
        const [detalles] = await connection.execute(
            `SELECT 
                dv.*,
                p.nombre as producto_nombre,
                p.codigo as producto_codigo,
                p.codigo_barras as producto_codigo_barras
            FROM detalle_ventas dv
            LEFT JOIN productos p ON dv.producto_id = p.id
            WHERE dv.venta_id = ?
            ORDER BY dv.id ASC`,
            [ventaId]
        );

        // === OBTENER EXTRAS (si existen) ===
        let extras = [];
        try {
            const [extrasResult] = await connection.execute(
                `SELECT * FROM venta_extras 
                 WHERE venta_id = ?
                 ORDER BY id ASC`,
                [ventaId]
            );
            extras = extrasResult;
        } catch (error) {
            // Tabla venta_extras puede no existir
            console.log('Tabla venta_extras no disponible');
        }

        // === OBTENER DATOS DE LA EMPRESA ===
        const [empresas] = await connection.execute(
            `SELECT 
                nombre,
                rnc,
                direccion,
                telefono,
                email,
                logo_url,
                mensaje_ticket,
                mensaje_fiscal
            FROM empresas
            WHERE id = ?`,
            [venta.empresa_id]
        );

        const empresa = empresas[0] || {
            nombre: 'ISIWEEK POS',
            rnc: 'N/A',
            direccion: '',
            telefono: '',
        };

        // === CONSTRUIR RESPUESTA ===
        return NextResponse.json({
            success: true,
            venta: {
                ...venta,
                detalles,
                extras
            },
            empresa
        });

    } catch (error) {
        console.error('Error al obtener venta:', error);
        return NextResponse.json(
            { error: 'Error al obtener venta: ' + error.message },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
