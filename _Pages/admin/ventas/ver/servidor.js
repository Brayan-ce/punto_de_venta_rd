"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerDetalleVenta(ventaId) {
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

        connection = await db.getConnection()

        const [venta] = await connection.execute(
            `SELECT 
                v.id,
                v.tipo_comprobante_id,
                v.ncf,
                v.numero_interno,
                v.cliente_id,
                v.subtotal,
                v.descuento,
                v.monto_gravado,
                v.itbis,
                v.total,
                v.metodo_pago,
                v.tipo_entrega,
                v.despacho_completo,
                v.efectivo_recibido,
                v.cambio,
                v.estado,
                v.razon_anulacion,
                v.notas,
                v.fecha_venta,
                tc.codigo as tipo_comprobante_codigo,
                tc.nombre as tipo_comprobante_nombre,
                u.nombre as usuario_nombre,
                c.nombre as cliente_nombre,
                c.numero_documento as cliente_numero_documento,
                c.telefono as cliente_telefono,
                c.email as cliente_email,
                td.codigo as cliente_tipo_documento
            FROM ventas v
            INNER JOIN tipos_comprobante tc ON v.tipo_comprobante_id = tc.id
            INNER JOIN usuarios u ON v.usuario_id = u.id
            LEFT JOIN clientes c ON v.cliente_id = c.id
            LEFT JOIN tipos_documento td ON c.tipo_documento_id = td.id
            WHERE v.id = ? AND v.empresa_id = ?`,
            [ventaId, empresaId]
        )

        if (venta.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Venta no encontrada'
            }
        }

        const [empresa] = await connection.execute(
            `SELECT 
                id,
                nombre_empresa,
                rnc,
                razon_social,
                direccion,
                telefono,
                email,
                impuesto_nombre,
                impuesto_porcentaje,
                moneda,
                locale,
                simbolo_moneda
            FROM empresas
            WHERE id = ? AND activo = TRUE`,
            [empresaId]
        )

        if (empresa.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Empresa no encontrada'
            }
        }

        const [productos] = await connection.execute(
            `SELECT 
                dv.id,
                dv.producto_id,
                dv.cantidad,
                dv.cantidad_despachada,
                dv.cantidad_pendiente,
                dv.precio_unitario,
                dv.subtotal,
                dv.descuento,
                dv.monto_gravado,
                dv.itbis,
                dv.total,
                p.nombre as nombre_producto,
                p.codigo_barras,
                p.sku
            FROM detalle_ventas dv
            INNER JOIN productos p ON dv.producto_id = p.id
            WHERE dv.venta_id = ?
            ORDER BY dv.id ASC`,
            [ventaId]
        )

        let despachos = []

        if (venta[0].tipo_entrega === 'parcial') {
            const [despachosData] = await connection.execute(
                `SELECT 
                    d.id,
                    d.numero_despacho,
                    d.fecha_despacho,
                    d.observaciones,
                    d.estado,
                    u.nombre as usuario_nombre
                FROM despachos d
                INNER JOIN usuarios u ON d.usuario_id = u.id
                WHERE d.venta_id = ?
                ORDER BY d.numero_despacho DESC`,
                [ventaId]
            )

            for (const despacho of despachosData) {
                const [productosDespacho] = await connection.execute(
                    `SELECT 
                        dd.id,
                        dd.cantidad_despachada,
                        p.nombre as nombre_producto
                    FROM detalle_despachos dd
                    INNER JOIN detalle_ventas dv ON dd.detalle_venta_id = dv.id
                    INNER JOIN productos p ON dv.producto_id = p.id
                    WHERE dd.despacho_id = ?
                    ORDER BY p.nombre ASC`,
                    [despacho.id]
                )

                despachos.push({
                    ...despacho,
                    productos: productosDespacho
                })
            }
        }

        connection.release()

        return {
            success: true,
            venta: {
                ...venta[0],
                productos: productos,
                despachos: despachos
            },
            empresa: empresa[0]
        }

    } catch (error) {
        console.error('Error al obtener detalle de venta:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar datos de la venta'
        }
    }
}