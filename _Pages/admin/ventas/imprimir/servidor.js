"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerVentaImprimir(ventaId) {
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
                v.efectivo_recibido,
                v.cambio,
                v.estado,
                v.notas,
                v.fecha_venta,
                tc.codigo as tipo_comprobante_codigo,
                tc.nombre as tipo_comprobante_nombre,
                u.nombre as usuario_nombre,
                c.nombre as cliente_nombre,
                c.numero_documento as cliente_numero_documento,
                c.telefono as cliente_telefono,
                c.email as cliente_email,
                c.direccion as cliente_direccion,
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
                nombre_comercial,
                direccion,
                sector,
                municipio,
                provincia,
                telefono,
                email,
                logo_url,
                impuesto_nombre,
                impuesto_porcentaje,
                moneda,
                locale,
                simbolo_moneda,
                mensaje_factura
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
                dv.cantidad_base,
                dv.unidad_medida_id,
                dv.precio_unitario,
                dv.subtotal,
                dv.descuento,
                dv.monto_gravado,
                dv.itbis,
                dv.total,
                p.nombre as nombre_producto,
                p.codigo_barras,
                p.sku,
                p.unidad_medida_id as producto_unidad_base_id,
                um_venta.abreviatura as unidad_venta_abreviatura,
                um_venta.nombre as unidad_venta_nombre,
                um_base.abreviatura as unidad_base_abreviatura,
                um_base.nombre as unidad_base_nombre
            FROM detalle_ventas dv
            INNER JOIN productos p ON dv.producto_id = p.id
            LEFT JOIN unidades_medida um_venta ON dv.unidad_medida_id = um_venta.id
            LEFT JOIN unidades_medida um_base ON p.unidad_medida_id = um_base.id
            WHERE dv.venta_id = ?
            ORDER BY dv.id ASC`,
            [ventaId]
        )

        const [extras] = await connection.execute(
            `SELECT 
                id,
                tipo,
                nombre,
                cantidad,
                precio_unitario,
                aplica_itbis,
                impuesto_porcentaje,
                monto_base,
                monto_impuesto,
                monto_total,
                notas
            FROM venta_extras
            WHERE venta_id = ?
            ORDER BY id ASC`,
            [ventaId]
        )

        const metodoPagoTexto = {
            efectivo: 'Efectivo',
            tarjeta_debito: 'Tarjeta de Débito',
            tarjeta_credito: 'Tarjeta de Crédito',
            transferencia: 'Transferencia Bancaria',
            cheque: 'Cheque',
            mixto: 'Pago Mixto'
        }

        connection.release()

        return {
            success: true,
            venta: {
                ...venta[0],
                metodo_pago_texto: metodoPagoTexto[venta[0].metodo_pago] || venta[0].metodo_pago,
                productos: productos,
                extras: extras
            },
            empresa: empresa[0]
        }

    } catch (error) {
        console.error('Error al obtener venta para imprimir:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar datos de la venta'
        }
    }
}