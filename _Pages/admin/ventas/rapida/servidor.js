"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

// Función para crear venta rápida (importada del servidor nueva)
export async function crearVentaRapida(datosVenta) {
    const { crearVenta } = await import('../nueva/servidor')
    return crearVenta(datosVenta)
}

export async function obtenerProductosPOS({ pagina = 1, limite = 40, categoriaId = null, busqueda = '' } = {}) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()

        const [empresa] = await connection.execute(
            `SELECT id, nombre_empresa, moneda, simbolo_moneda, locale, impuesto_nombre, impuesto_porcentaje
             FROM empresas WHERE id = ? AND activo = TRUE`,
            [empresaId]
        )

        if (empresa.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Empresa no encontrada' }
        }

        const [categorias] = await connection.execute(
            `SELECT DISTINCT c.id, c.nombre
             FROM categorias c
             INNER JOIN productos p ON p.categoria_id = c.id
             WHERE p.empresa_id = ? AND p.activo = TRUE
             ORDER BY c.nombre ASC`,
            [empresaId]
        )

        const condiciones = ['p.empresa_id = ?', 'p.activo = TRUE']
        const params = [empresaId]

        if (categoriaId) { condiciones.push('p.categoria_id = ?'); params.push(categoriaId) }
        if (busqueda.trim()) { condiciones.push('p.nombre LIKE ?'); params.push(`%${busqueda.trim()}%`) }

        const where = condiciones.join(' AND ')
        const offset = (pagina - 1) * limite

        const [[{ total }]] = await connection.execute(
            `SELECT COUNT(*) as total FROM productos p WHERE ${where}`,
            params
        )

        const [productos] = await connection.execute(
            `SELECT p.id,
                    p.nombre,
                    p.precio_venta,
                    p.precio_mayorista,
                    p.cantidad_mayorista,
                    p.stock,
                    p.aplica_itbis,
                    p.imagen_url,
                    p.categoria_id,
                    p.permite_decimales,
                    p.unidad_medida_id,
                    p.unidad_venta_default_id,
                    c.nombre as categoria_nombre,
                    um.nombre as unidad_medida_nombre,
                    um.abreviatura as unidad_medida_abreviatura
             FROM productos p
             LEFT JOIN categorias c ON p.categoria_id = c.id
             LEFT JOIN unidades_medida um ON p.unidad_medida_id = um.id
             WHERE ${where}
             ORDER BY c.nombre ASC, p.nombre ASC
             LIMIT ? OFFSET ?`,
            [...params, limite, offset]
        )

        const [clientes] = await connection.execute(
            `SELECT id, nombre
             FROM clientes
             WHERE empresa_id = ? AND activo = TRUE
             ORDER BY nombre ASC LIMIT 200`,
            [empresaId]
        )

        const [tiposComprobante] = await connection.execute(
            `SELECT id, codigo, nombre, prefijo_ncf, requiere_rnc, requiere_razon_social
             FROM tipos_comprobante WHERE activo = TRUE ORDER BY codigo ASC`
        )

        connection.release()

        return {
            success: true,
            empresa: empresa[0],
            categorias,
            productos,
            clientes,
            tiposComprobante,
            paginacion: {
                total: parseInt(total),
                pagina,
                limite,
                totalPaginas: Math.ceil(total / limite)
            }
        }

    } catch (error) {
        console.error('Error obtenerProductosPOS:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar datos' }
    }
}

export async function actualizarStockProducto(productoId, nuevoStock) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return { success: false, mensaje: 'Sin permisos' }
        }

        const stock = parseFloat(nuevoStock)
        if (isNaN(stock) || stock < 0) {
            return { success: false, mensaje: 'Stock inválido' }
        }

        connection = await db.getConnection()

        const [existe] = await connection.execute(
            `SELECT id, stock FROM productos WHERE id = ? AND empresa_id = ?`,
            [productoId, empresaId]
        )

        if (existe.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Producto no encontrado' }
        }

        const stockAnterior = parseFloat(existe[0].stock)

        await connection.execute(
            `UPDATE productos SET stock = ? WHERE id = ? AND empresa_id = ?`,
            [stock, productoId, empresaId]
        )

        await connection.execute(
            `INSERT INTO movimientos_inventario (empresa_id, producto_id, tipo, cantidad, stock_anterior, stock_nuevo, referencia, usuario_id, notas)
             VALUES (?, ?, 'ajuste', ?, ?, ?, 'AJUSTE-MANUAL', ?, 'Ajuste manual desde Venta Rápida')`,
            [empresaId, productoId, Math.abs(stock - stockAnterior), stockAnterior, stock, userId]
        )

        connection.release()
        return { success: true, mensaje: 'Stock actualizado' }

    } catch (error) {
        console.error('Error actualizarStockProducto:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al actualizar stock' }
    }
}
