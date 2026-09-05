"use server"

import db from '@/_DB/db'
import { cookies } from 'next/headers'

export async function obtenerInventarioSucursales() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!empresaId || !userId || userTipo !== 'sucursales') {
            return { success: false, mensaje: 'Sesion invalida' }
        }

        connection = await db.getConnection()

        const [sucursalesUsuario] = await connection.execute(
            `SELECT DISTINCT s.id, s.nombre
             FROM usuarios_sucursales us
             INNER JOIN sucursales s ON s.id = us.sucursal_id
             WHERE us.empresa_id = ?
               AND us.usuario_id = ?
               AND us.activo = TRUE
               AND s.activa = TRUE
             ORDER BY s.nombre ASC`,
            [empresaId, userId]
        )

        const [sucursalesEmpresa] = await connection.execute(
            `SELECT id, nombre
             FROM sucursales
             WHERE empresa_id = ? AND activa = TRUE
             ORDER BY nombre ASC`,
            [empresaId]
        )

        const sucursales = sucursalesUsuario.length > 0 ? sucursalesUsuario : sucursalesEmpresa
        const sucursalIds = sucursales.map(s => s.id)
        const placeholders = sucursalIds.map(() => '?').join(', ')

        let stock = []

        if (sucursalIds.length > 0) {
            const [stockPorSucursal] = await connection.execute(
                `SELECT
                    ss.id,
                    ss.sucursal_id,
                    s.nombre AS sucursal_nombre,
                    ss.producto_id,
                    p.nombre AS producto_nombre,
                    p.codigo_barras,
                    p.sku,
                    cat.nombre AS categoria_nombre,
                    um.abreviatura AS unidad_medida_abreviatura,
                    ss.stock_actual,
                    ss.stock_minimo,
                    ss.stock_maximo,
                    ss.ubicacion,
                    ss.fecha_actualizacion
                 FROM stock_sucursal ss
                 INNER JOIN sucursales s ON s.id = ss.sucursal_id
                 INNER JOIN productos p ON p.id = ss.producto_id
                 LEFT JOIN categorias cat ON cat.id = p.categoria_id
                 LEFT JOIN unidades_medida um ON um.id = p.unidad_medida_id
                 WHERE ss.empresa_id = ?
                   AND ss.sucursal_id IN (${placeholders})
                 ORDER BY s.nombre ASC, p.nombre ASC`,
                [empresaId, ...sucursalIds]
            )

            stock = stockPorSucursal
        }

        const usandoFallback = stock.length === 0

        if (usandoFallback) {
            const [productos] = await connection.execute(
                `SELECT
                    p.id,
                    p.nombre AS producto_nombre,
                    p.codigo_barras,
                    p.sku,
                    cat.nombre AS categoria_nombre,
                    um.abreviatura AS unidad_medida_abreviatura,
                    COALESCE(p.stock, 0) AS stock_actual,
                    COALESCE(p.stock_minimo, 0) AS stock_minimo,
                    COALESCE(p.stock_maximo, 0) AS stock_maximo,
                    NULL AS ubicacion,
                    p.fecha_actualizacion
                 FROM productos p
                 LEFT JOIN categorias cat ON cat.id = p.categoria_id
                 LEFT JOIN unidades_medida um ON um.id = p.unidad_medida_id
                 WHERE p.empresa_id = ?
                   AND p.activo = TRUE
                 ORDER BY p.nombre ASC`,
                [empresaId]
            )

            const sucursalNombreFallback = sucursales[0]?.nombre || 'Inventario General'
            const sucursalIdFallback = sucursales[0]?.id || 0

            stock = productos.map((p, idx) => ({
                id: Number(`9${idx + 1}`),
                sucursal_id: sucursalIdFallback,
                sucursal_nombre: sucursalNombreFallback,
                producto_id: p.id,
                producto_nombre: p.producto_nombre,
                codigo_barras: p.codigo_barras,
                sku: p.sku,
                categoria_nombre: p.categoria_nombre,
                unidad_medida_abreviatura: p.unidad_medida_abreviatura,
                stock_actual: p.stock_actual,
                stock_minimo: p.stock_minimo,
                stock_maximo: p.stock_maximo,
                ubicacion: p.ubicacion,
                fecha_actualizacion: p.fecha_actualizacion
            }))
        }

        const resumen = {
            total_registros: stock.length,
            productos_stock_bajo: stock.filter(s => Number(s.stock_actual || 0) <= Number(s.stock_minimo || 0)).length,
            productos_sin_stock: stock.filter(s => Number(s.stock_actual || 0) <= 0).length,
            sucursales_con_stock: new Set(stock.map(s => s.sucursal_id)).size
        }

        const sucursalesParaFiltro = sucursales.length > 0
            ? sucursales
            : [{ id: 0, nombre: 'Inventario General' }]

        connection.release()

        return {
            success: true,
            stock,
            sucursales: sucursalesParaFiltro,
            fuenteDatos: usandoFallback ? 'productos' : 'stock_sucursal',
            resumen: {
                totalRegistros: Number(resumen?.total_registros || 0),
                productosStockBajo: Number(resumen?.productos_stock_bajo || 0),
                productosSinStock: Number(resumen?.productos_sin_stock || 0),
                sucursalesConStock: Number(resumen?.sucursales_con_stock || 0)
            }
        }
    } catch (error) {
        console.error('Error al obtener inventario de sucursales:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar inventario de sucursales' }
    }
}
