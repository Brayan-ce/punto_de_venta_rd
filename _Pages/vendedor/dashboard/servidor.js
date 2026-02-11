"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerDatosDashboard() {
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

        const hoy = new Date()
        const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
        const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59)

        const inicioSemana = new Date(hoy)
        inicioSemana.setDate(hoy.getDate() - 7)

        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)

        // Para vendedores: solo calcular ventas del vendedor actual
        const condicionUsuario = userTipo === 'vendedor' ? 'AND usuario_id = ?' : ''
        const parametrosVentas = userTipo === 'vendedor' ? [empresaId, userId] : [empresaId]

        const [ventasHoy] = await connection.execute(
            `SELECT SUM(total) as total, COUNT(*) as cantidad
            FROM ventas
            WHERE empresa_id = ? 
            AND estado = 'emitida'
            ${condicionUsuario}
            AND fecha_venta BETWEEN ? AND ?`,
            userTipo === 'vendedor' ? [empresaId, userId, inicioHoy, finHoy] : [empresaId, inicioHoy, finHoy]
        )

        const [ventasSemana] = await connection.execute(
            `SELECT SUM(total) as total, COUNT(*) as cantidad
            FROM ventas
            WHERE empresa_id = ? 
            AND estado = 'emitida'
            ${condicionUsuario}
            AND fecha_venta >= ?`,
            userTipo === 'vendedor' ? [empresaId, userId, inicioSemana] : [empresaId, inicioSemana]
        )

        const [ventasMes] = await connection.execute(
            `SELECT SUM(total) as total, COUNT(*) as cantidad
            FROM ventas
            WHERE empresa_id = ? 
            AND estado = 'emitida'
            ${condicionUsuario}
            AND fecha_venta >= ?`,
            userTipo === 'vendedor' ? [empresaId, userId, inicioMes] : [empresaId, inicioMes]
        )

        const [productos] = await connection.execute(
            `SELECT COUNT(*) as total,
                    SUM(CASE WHEN activo = TRUE THEN 1 ELSE 0 END) as activos,
                    SUM(CASE WHEN stock <= stock_minimo THEN 1 ELSE 0 END) as bajo_stock,
                    SUM(precio_venta * stock) as valor_inventario
            FROM productos
            WHERE empresa_id = ?`,
            [empresaId]
        )

        const [clientes] = await connection.execute(
            `SELECT COUNT(*) as total,
                    SUM(CASE WHEN activo = TRUE THEN 1 ELSE 0 END) as activos
            FROM clientes
            WHERE empresa_id = ?`,
            [empresaId]
        )

        // Construir consultas de lista de ventas
        const condicionVentasUsuario = userTipo === 'vendedor' ? 'AND v.usuario_id = ?' : ''
        const camposTotal = userTipo === 'vendedor' ? 'NULL as total' : 'v.total'

        const [listaVentasHoy] = await connection.execute(
            `SELECT v.id, v.ncf, ${camposTotal}, v.fecha_venta,
                    CONCAT(c.nombre, ' ', COALESCE(c.apellidos, '')) as cliente_nombre
            FROM ventas v
            LEFT JOIN clientes c ON v.cliente_id = c.id
            WHERE v.empresa_id = ? 
            AND v.estado = 'emitida'
            ${condicionVentasUsuario}
            AND v.fecha_venta BETWEEN ? AND ?
            ORDER BY v.fecha_venta DESC
            LIMIT 10`,
            userTipo === 'vendedor' ? [empresaId, userId, inicioHoy, finHoy] : [empresaId, inicioHoy, finHoy]
        )

        const [listaVentasSemana] = await connection.execute(
            `SELECT v.id, v.ncf, ${camposTotal}, v.fecha_venta,
                    CONCAT(c.nombre, ' ', COALESCE(c.apellidos, '')) as cliente_nombre
            FROM ventas v
            LEFT JOIN clientes c ON v.cliente_id = c.id
            WHERE v.empresa_id = ? 
            AND v.estado = 'emitida'
            ${condicionVentasUsuario}
            AND v.fecha_venta >= ?
            ORDER BY v.fecha_venta DESC
            LIMIT 10`,
            userTipo === 'vendedor' ? [empresaId, userId, inicioSemana] : [empresaId, inicioSemana]
        )

        const [listaVentasMes] = await connection.execute(
            `SELECT v.id, v.ncf, ${camposTotal}, v.fecha_venta,
                    CONCAT(c.nombre, ' ', COALESCE(c.apellidos, '')) as cliente_nombre
            FROM ventas v
            LEFT JOIN clientes c ON v.cliente_id = c.id
            WHERE v.empresa_id = ? 
            AND v.estado = 'emitida'
            ${condicionVentasUsuario}
            AND v.fecha_venta >= ?
            ORDER BY v.fecha_venta DESC
            LIMIT 10`,
            userTipo === 'vendedor' ? [empresaId, userId, inicioMes] : [empresaId, inicioMes]
        )

        // Top productos
        const camposMontoTotal = userTipo === 'vendedor' ? 'NULL as monto_total' : 'SUM(dv.total) as monto_total'
        const condicionTopProductos = userTipo === 'vendedor' ? 'AND v.usuario_id = ?' : ''

        const [topProductos] = await connection.execute(
            `SELECT p.id, p.nombre, p.imagen_url,
                    cat.nombre as categoria_nombre,
                    SUM(dv.cantidad) as total_vendido,
                    ${camposMontoTotal}
            FROM productos p
            LEFT JOIN categorias cat ON p.categoria_id = cat.id
            INNER JOIN detalle_ventas dv ON p.id = dv.producto_id
            INNER JOIN ventas v ON dv.venta_id = v.id
            WHERE p.empresa_id = ? 
            AND v.estado = 'emitida'
            ${condicionTopProductos}
            AND v.fecha_venta >= ?
            GROUP BY p.id, p.nombre, p.imagen_url, cat.nombre
            ORDER BY total_vendido DESC
            LIMIT 10`,
            userTipo === 'vendedor' ? [empresaId, userId, inicioMes] : [empresaId, inicioMes]
        )

        // Productos bajo stock (para vendedores: no mostrar números)
        const camposStock = userTipo === 'vendedor' ? 'NULL as stock, NULL as stock_minimo' : 'p.stock, p.stock_minimo'

        const [productosBajoStock] = await connection.execute(
            `SELECT p.id, p.nombre, p.imagen_url, 
                    ${camposStock},
                    cat.nombre as categoria_nombre
            FROM productos p
            LEFT JOIN categorias cat ON p.categoria_id = cat.id
            WHERE p.empresa_id = ? 
            AND p.activo = TRUE
            AND p.stock <= p.stock_minimo
            ORDER BY (p.stock - p.stock_minimo) ASC
            LIMIT 10`,
            [empresaId]
        )

        const [clientesRecientes] = await connection.execute(
            `SELECT c.id, c.nombre, c.apellidos, c.numero_documento, c.email,
                    c.total_compras, c.puntos_fidelidad, c.fecha_creacion,
                    td.codigo as tipo_documento_codigo
            FROM clientes c
            INNER JOIN tipos_documento td ON c.tipo_documento_id = td.id
            WHERE c.empresa_id = ?
            ORDER BY c.fecha_creacion DESC
            LIMIT 5`,
            [empresaId]
        )

        const [cajaAbierta] = await connection.execute(
            `SELECT id, numero_caja, monto_inicial
            FROM cajas
            WHERE empresa_id = ?
            AND usuario_id = ?
            AND estado = 'abierta'
            AND fecha_caja = CURDATE()
            ORDER BY fecha_apertura DESC
            LIMIT 1`,
            [empresaId, userId]
        )

        const totalVentasHoy = parseFloat(ventasHoy[0]?.total || 0)
        const cantidadVentasHoy = parseInt(ventasHoy[0]?.cantidad || 0)
        const totalVentasSemana = parseFloat(ventasSemana[0]?.total || 0)
        const cantidadVentasSemana = parseInt(ventasSemana[0]?.cantidad || 0)
        const totalVentasMes = parseFloat(ventasMes[0]?.total || 0)
        const cantidadVentasMes = parseInt(ventasMes[0]?.cantidad || 0)

        const promedioVenta = cantidadVentasMes > 0 ? totalVentasMes / cantidadVentasMes : 0

        connection.release()

        // Filtrar datos según el rol
        const resumen = {
            // Para vendedores: no mostrar montos, solo cantidades
            ventasHoy: userTipo === 'vendedor' ? null : totalVentasHoy,
            cantidadVentasHoy: cantidadVentasHoy,
            ventasSemana: userTipo === 'vendedor' ? null : totalVentasSemana,
            cantidadVentasSemana: cantidadVentasSemana,
            ventasMes: userTipo === 'vendedor' ? null : totalVentasMes,
            cantidadVentasMes: cantidadVentasMes,
            promedioVenta: userTipo === 'vendedor' ? null : promedioVenta,
            totalProductos: parseInt(productos[0]?.total || 0),
            productosActivos: parseInt(productos[0]?.activos || 0),
            productosBajoStock: userTipo === 'vendedor' ? null : parseInt(productos[0]?.bajo_stock || 0),
            valorInventario: userTipo === 'vendedor' ? null : parseFloat(productos[0]?.valor_inventario || 0),
            totalClientes: parseInt(clientes[0]?.total || 0),
            clientesActivos: parseInt(clientes[0]?.activos || 0)
        }

        return {
            success: true,
            datos: {
                resumen: resumen,
                ventasHoy: listaVentasHoy,
                ventasSemana: listaVentasSemana,
                ventasMes: listaVentasMes,
                topProductos: topProductos,
                productosBajoStock: productosBajoStock,
                clientesRecientes: clientesRecientes,
                alertas: {
                    cajaAbierta: cajaAbierta.length > 0,
                    numeroCaja: cajaAbierta[0]?.numero_caja || null,
                    montoInicial: userTipo === 'vendedor' ? null : parseFloat(cajaAbierta[0]?.monto_inicial || 0)
                }
            }
        }

    } catch (error) {
        console.error('Error al obtener datos del dashboard:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar datos del dashboard'
        }
    }
}
